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
import { encrypt, decrypt } from '../common/crypto.js';
import { SmtpService } from './smtp.service.js';
import { EmailGateway } from '../emailGateway/emailGateway.gateway.js';
import { SendReplyDto } from './dto/sendReply.dto.js';

@Injectable()
export class GmailIngestionService {
  private readonly logger = new Logger(GmailIngestionService.name);

  constructor(
    private readonly supabase_service: SupabaseService,
    private readonly email_poll_service: EmailPollService,
    private readonly smtp_service: SmtpService,
    private readonly email_gateway: EmailGateway,
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
        department: dto.department || 'general',
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
    if (dto.department !== undefined) update_data.department = dto.department;

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

  // --- Reply ---

  async send_reply(
    email_id: string,
    dto: SendReplyDto,
  ): Promise<EmailResponseDto> {
    const client = this.supabase_service.getClient();

    // 1. Fetch original email
    const { data: original, error: fetch_error } = await client
      .from('emails')
      .select('*')
      .eq('id', email_id)
      .single();

    if (fetch_error || !original) {
      throw new NotFoundException(`Email ${email_id} not found`);
    }

    // 2. Fetch support_email credentials
    const { data: support_email, error: se_error } = await client
      .from('support_emails')
      .select('*')
      .eq('id', original.support_email_id)
      .single();

    if (se_error || !support_email) {
      throw new NotFoundException(
        `Support email for ${email_id} not found`,
      );
    }

    const smtp_password = decrypt(support_email.imap_password);

    // 3. Send via SMTP
    const subject = original.subject?.startsWith('Re:')
      ? original.subject
      : `Re: ${original.subject || ''}`;

    const { message_id: sent_message_id } =
      await this.smtp_service.send_email(
        support_email.email_address,
        smtp_password,
        {
          from: support_email.display_name
            ? `"${support_email.display_name}" <${support_email.email_address}>`
            : support_email.email_address,
          to: original.from_address,
          cc: dto.cc,
          bcc: dto.bcc,
          subject,
          text: dto.body_text,
          html: dto.body_html,
          in_reply_to: original.message_id,
          references: original.thread_id || original.message_id,
        },
      );

    // 4. Persist outbound row
    const { data: reply_row, error: insert_error } = await client
      .from('emails')
      .insert({
        support_email_id: original.support_email_id,
        message_id: sent_message_id,
        thread_id: original.thread_id || original.message_id,
        from_address: support_email.email_address,
        from_name: support_email.display_name || support_email.email_address,
        to_addresses: [original.from_address],
        cc_addresses: dto.cc || [],
        bcc_addresses: dto.bcc || [],
        subject,
        body_text: dto.body_text,
        body_html: dto.body_html || null,
        snippet: dto.body_text.slice(0, 200),
        has_attachments: false,
        attachments: [],
        internal_date: new Date().toISOString(),
        received_at: new Date().toISOString(),
        is_read: true,
        direction: 'outbound',
        agent_name: dto.agent_name || null,
        in_reply_to: original.message_id,
      })
      .select()
      .single();

    if (insert_error || !reply_row) {
      this.logger.error('Failed to persist outbound reply', insert_error);
      throw new Error('Reply sent but failed to persist');
    }

    const response = reply_row as unknown as EmailResponseDto;

    // 5. Broadcast via WebSocket
    this.email_gateway.emit_new_email(response);

    this.logger.log(
      `Reply sent for email ${email_id} → ${original.from_address}`,
    );

    return response;
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
      department: record.department,
      last_synced_at: record.last_synced_at,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }
}
