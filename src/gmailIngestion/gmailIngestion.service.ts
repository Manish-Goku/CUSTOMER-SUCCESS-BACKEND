import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { GmailService } from './gmail.service.js';
import { EmailGateway } from '../emailGateway/emailGateway.gateway.js';
import { AddSupportEmailDto } from './dto/addSupportEmail.dto.js';
import { UpdateSupportEmailDto } from './dto/updateSupportEmail.dto.js';
import { SupportEmailResponseDto } from './dto/supportEmailResponse.dto.js';
import { EmailResponseDto } from './dto/emailResponse.dto.js';
import { GetEmailsDto } from './dto/getEmails.dto.js';
import { GmailPushNotificationDto } from './dto/gmailPushNotification.dto.js';
import {
  SupportEmailRecord,
  EmailRecord,
} from '../common/interfaces/gmailTypes.js';

@Injectable()
export class GmailIngestionService {
  private readonly logger = new Logger(GmailIngestionService.name);

  constructor(
    private readonly supabase_service: SupabaseService,
    private readonly gmail_service: GmailService,
    private readonly email_gateway: EmailGateway,
  ) {}

  // --- Support Email CRUD ---

  async add_support_email(
    dto: AddSupportEmailDto,
  ): Promise<SupportEmailResponseDto> {
    const client = this.supabase_service.getClient();

    // Check if already exists
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

    // Insert record
    const { data: record, error: insert_error } = await client
      .from('support_emails')
      .insert({
        email_address: dto.email_address,
        display_name: dto.display_name || null,
      })
      .select()
      .single();

    if (insert_error || !record) {
      this.logger.error('Failed to insert support email', insert_error);
      throw new Error('Failed to add support email');
    }

    // Start Gmail watch
    try {
      const watch_result = await this.gmail_service.setup_watch(
        dto.email_address,
      );

      const { error: update_error } = await client
        .from('support_emails')
        .update({
          watch_expiration: new Date(
            parseInt(watch_result.expiration),
          ).toISOString(),
          watch_history_id: watch_result.history_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', record.id);

      if (update_error) {
        this.logger.error('Failed to update watch info', update_error);
      }

      record.watch_expiration = new Date(
        parseInt(watch_result.expiration),
      ).toISOString();
    } catch (err) {
      this.logger.error(
        `Failed to start Gmail watch for ${dto.email_address}. Record created but watch not active.`,
        err,
      );
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

    if (dto.display_name !== undefined) {
      update_data.display_name = dto.display_name;
    }

    if (dto.is_active !== undefined) {
      update_data.is_active = dto.is_active;

      // Start or stop watch based on is_active toggle
      if (dto.is_active && !existing.is_active) {
        try {
          const watch_result = await this.gmail_service.setup_watch(
            existing.email_address,
          );
          update_data.watch_expiration = new Date(
            parseInt(watch_result.expiration),
          ).toISOString();
          update_data.watch_history_id = watch_result.history_id;
        } catch (err) {
          this.logger.error(
            `Failed to start watch for ${existing.email_address}`,
            err,
          );
        }
      } else if (!dto.is_active && existing.is_active) {
        try {
          await this.gmail_service.stop_watch(existing.email_address);
          update_data.watch_expiration = null;
          update_data.watch_history_id = null;
        } catch (err) {
          this.logger.error(
            `Failed to stop watch for ${existing.email_address}`,
            err,
          );
        }
      }
    }

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

    // Stop Gmail watch
    try {
      await this.gmail_service.stop_watch(existing.email_address);
    } catch (err) {
      this.logger.error(
        `Failed to stop watch for ${existing.email_address}`,
        err,
      );
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

  async start_watch(
    id: string,
  ): Promise<{ success: boolean; expiration: string }> {
    const client = this.supabase_service.getClient();

    const { data: existing, error } = await client
      .from('support_emails')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !existing) {
      throw new NotFoundException(`Support email ${id} not found`);
    }

    const watch_result = await this.gmail_service.setup_watch(
      existing.email_address,
    );
    const expiration = new Date(
      parseInt(watch_result.expiration),
    ).toISOString();

    await client
      .from('support_emails')
      .update({
        watch_expiration: expiration,
        watch_history_id: watch_result.history_id,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    return { success: true, expiration };
  }

  async stop_watch(id: string): Promise<{ success: boolean }> {
    const client = this.supabase_service.getClient();

    const { data: existing, error } = await client
      .from('support_emails')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !existing) {
      throw new NotFoundException(`Support email ${id} not found`);
    }

    await this.gmail_service.stop_watch(existing.email_address);

    await client
      .from('support_emails')
      .update({
        watch_expiration: null,
        watch_history_id: null,
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    return { success: true };
  }

  // --- Webhook Processing ---

  async process_push_notification(
    notification: GmailPushNotificationDto,
  ): Promise<void> {
    const decoded = JSON.parse(
      Buffer.from(notification.message.data, 'base64').toString('utf-8'),
    );

    const email_address: string = decoded.emailAddress;
    const new_history_id: string = decoded.historyId;

    this.logger.log(
      `Push notification for ${email_address}, historyId: ${new_history_id}`,
    );

    const client = this.supabase_service.getClient();

    // Find the support email record
    const { data: support_email, error: fetch_error } = await client
      .from('support_emails')
      .select('*')
      .eq('email_address', email_address)
      .eq('is_active', true)
      .single();

    if (fetch_error || !support_email) {
      this.logger.warn(
        `Received push for unregistered/inactive email: ${email_address}`,
      );
      return;
    }

    if (!support_email.watch_history_id) {
      this.logger.warn(
        `No history_id stored for ${email_address}, skipping`,
      );
      return;
    }

    // Get new message IDs since last known history
    let message_ids: string[];
    try {
      message_ids = await this.gmail_service.get_new_messages(
        email_address,
        support_email.watch_history_id,
      );
    } catch (err) {
      this.logger.error(
        `Failed to fetch new messages for ${email_address}`,
        err,
      );
      return;
    }

    this.logger.log(
      `Found ${message_ids.length} new messages for ${email_address}`,
    );

    for (const message_id of message_ids) {
      // Dedup check
      const { data: existing_email } = await client
        .from('emails')
        .select('id')
        .eq('gmail_message_id', message_id)
        .single();

      if (existing_email) continue;

      try {
        const parsed = await this.gmail_service.get_message(
          email_address,
          message_id,
        );

        const { data: inserted, error: insert_error } = await client
          .from('emails')
          .insert({
            support_email_id: support_email.id,
            gmail_message_id: parsed.gmail_message_id,
            thread_id: parsed.thread_id,
            history_id: parsed.history_id,
            from_address: parsed.from_address,
            from_name: parsed.from_name,
            to_addresses: parsed.to_addresses,
            cc_addresses: parsed.cc_addresses,
            bcc_addresses: parsed.bcc_addresses,
            subject: parsed.subject,
            body_text: parsed.body_text,
            body_html: parsed.body_html,
            snippet: parsed.snippet,
            label_ids: parsed.label_ids,
            has_attachments: parsed.has_attachments,
            attachments: parsed.attachments,
            internal_date: parsed.internal_date?.toISOString() || null,
          })
          .select()
          .single();

        if (insert_error) {
          this.logger.error(
            `Failed to insert email ${message_id}`,
            insert_error,
          );
          continue;
        }

        // Push to frontend via WebSocket
        const email_dto = inserted as EmailRecord;
        this.email_gateway.emit_new_email_to_inbox(
          support_email.id,
          email_dto as unknown as EmailResponseDto,
        );
        this.email_gateway.emit_new_email(
          email_dto as unknown as EmailResponseDto,
        );

        this.logger.log(`Ingested and broadcast email: ${message_id}`);
      } catch (err) {
        this.logger.error(`Failed to process message ${message_id}`, err);
      }
    }

    // Update history_id
    await client
      .from('support_emails')
      .update({
        watch_history_id: new_history_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', support_email.id);
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
      watch_expiration: record.watch_expiration,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }
}
