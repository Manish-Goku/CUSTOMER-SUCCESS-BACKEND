import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { EmailPollService } from './emailPoll.service.js';
import { AddSupportEmailDto } from './dto/addSupportEmail.dto.js';
import { UpdateSupportEmailDto } from './dto/updateSupportEmail.dto.js';
import { SupportEmailResponseDto } from './dto/supportEmailResponse.dto.js';
import { EmailResponseDto } from './dto/emailResponse.dto.js';
import { GetEmailsDto } from './dto/getEmails.dto.js';
import {
  SupportEmailRecord,
  EmailRecord,
} from '../common/interfaces/gmailTypes.js';
import { encrypt } from '../common/crypto.js';

@Injectable()
export class GmailIngestionService {
  private readonly logger = new Logger(GmailIngestionService.name);

  constructor(
    private readonly supabase_service: SupabaseService,
    private readonly email_poll_service: EmailPollService,
  ) {}

  // --- Support Email CRUD ---

  async add_support_email(
    dto: AddSupportEmailDto,
  ): Promise<SupportEmailResponseDto> {
    const client = this.supabase_service.getClient();

    const { data: existing } = await client
      .from('support_emails')
      .select('id')
      .eq('email_address', dto.email_address)
      .single();

    if (existing) {
      throw new ConflictException(
        `Email ${dto.email_address} is already being monitored`,
      );
    }

    const { data: record, error: insert_error } = await client
      .from('support_emails')
      .insert({
        email_address: dto.email_address,
        display_name: dto.display_name || null,
        imap_host: 'imap.gmail.com',
        imap_port: 993,
        imap_user: dto.email_address,
        imap_password: encrypt(dto.imap_password),
      })
      .select()
      .single();

    if (insert_error || !record) {
      this.logger.error('Failed to insert support email', insert_error);
      throw new Error('Failed to add support email');
    }

    return this.map_support_email(record as SupportEmailRecord);
  }

  async get_support_emails(): Promise<SupportEmailResponseDto[]> {
    const { data, error } = await this.supabase_service
      .getClient()
      .from('support_emails')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Failed to fetch support emails', error);
      throw new Error('Failed to fetch support emails');
    }

    return (data as SupportEmailRecord[]).map((r) =>
      this.map_support_email(r),
    );
  }

  async get_support_email(id: string): Promise<SupportEmailResponseDto> {
    const { data, error } = await this.supabase_service
      .getClient()
      .from('support_emails')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Support email ${id} not found`);
    }

    return this.map_support_email(data as SupportEmailRecord);
  }

  async update_support_email(
    id: string,
    dto: UpdateSupportEmailDto,
  ): Promise<SupportEmailResponseDto> {
    const client = this.supabase_service.getClient();

    const { data: existing, error: fetch_error } = await client
      .from('support_emails')
      .select('*')
      .eq('id', id)
      .single();

    if (fetch_error || !existing) {
      throw new NotFoundException(`Support email ${id} not found`);
    }

    const update_data: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.display_name !== undefined) update_data.display_name = dto.display_name;
    if (dto.is_active !== undefined) update_data.is_active = dto.is_active;
    if (dto.imap_password !== undefined) update_data.imap_password = encrypt(dto.imap_password);

    const { data: updated, error: update_error } = await client
      .from('support_emails')
      .update(update_data)
      .eq('id', id)
      .select()
      .single();

    if (update_error || !updated) {
      throw new Error('Failed to update support email');
    }

    return this.map_support_email(updated as SupportEmailRecord);
  }

  async remove_support_email(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const client = this.supabase_service.getClient();

    const { data: existing, error: fetch_error } = await client
      .from('support_emails')
      .select('*')
      .eq('id', id)
      .single();

    if (fetch_error || !existing) {
      throw new NotFoundException(`Support email ${id} not found`);
    }

    const { error: delete_error } = await client
      .from('support_emails')
      .delete()
      .eq('id', id);

    if (delete_error) {
      throw new Error('Failed to delete support email');
    }

    return {
      success: true,
      message: `Removed ${existing.email_address} and stopped monitoring`,
    };
  }

  // --- Manual Sync ---

  async sync_mailbox(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    const client = this.supabase_service.getClient();

    const { data: mailbox, error } = await client
      .from('support_emails')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !mailbox) {
      throw new NotFoundException(`Support email ${id} not found`);
    }

    await this.email_poll_service.poll_single_mailbox(
      mailbox as SupportEmailRecord,
    );

    return { success: true, message: `Sync triggered for ${mailbox.email_address}` };
  }

  // --- Email Queries ---

  async get_emails(
    dto: GetEmailsDto,
  ): Promise<{ data: EmailResponseDto[]; total: number }> {
    const client = this.supabase_service.getClient();
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const offset = (page - 1) * limit;

    let query = client
      .from('emails')
      .select('*', { count: 'exact' })
      .order('received_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (dto.support_email_id) {
      query = query.eq('support_email_id', dto.support_email_id);
    }

    const { data, error, count } = await query;

    if (error) {
      this.logger.error('Failed to fetch emails', error);
      throw new Error('Failed to fetch emails');
    }

    return {
      data: (data as EmailRecord[]) as unknown as EmailResponseDto[],
      total: count || 0,
    };
  }

  async get_email(id: string): Promise<EmailResponseDto> {
    const { data, error } = await this.supabase_service
      .getClient()
      .from('emails')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Email ${id} not found`);
    }

    return data as unknown as EmailResponseDto;
  }

  // --- Mappers ---

  private map_support_email(
    record: SupportEmailRecord,
  ): SupportEmailResponseDto {
    return {
      id: record.id,
      email_address: record.email_address,
      display_name: record.display_name,
      is_active: record.is_active,
      last_synced_at: record.last_synced_at,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }
}
