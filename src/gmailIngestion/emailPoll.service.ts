import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SupabaseService } from '../supabase/supabase.service.js';
import { ImapService } from './imap.service.js';
import { EmailAiService } from './emailAi.service.js';
import { EmailGateway } from '../emailGateway/emailGateway.gateway.js';
import { EmailResponseDto } from './dto/emailResponse.dto.js';
import { SupportEmailRecord, EmailRecord } from '../common/interfaces/gmailTypes.js';
import { decrypt } from '../common/crypto.js';

@Injectable()
export class EmailPollService {
  private readonly logger = new Logger(EmailPollService.name);

  constructor(
    private readonly supabase_service: SupabaseService,
    private readonly imap_service: ImapService,
    private readonly email_ai_service: EmailAiService,
    private readonly email_gateway: EmailGateway,
  ) {}

  @Cron('0 */1 * * * *')
  async poll_all_mailboxes(): Promise<void> {
    const { data: mailboxes, error } = await this.supabase_service
      .getClient()
      .from('support_emails')
      .select('*')
      .eq('is_active', true);

    if (error || !mailboxes) {
      this.logger.error('Failed to fetch active mailboxes', error);
      return;
    }

    for (const mailbox of mailboxes as SupportEmailRecord[]) {
      try {
        await this.poll_single_mailbox(mailbox);
      } catch (err) {
        this.logger.error(
          `Failed to poll mailbox ${mailbox.email_address}`,
          err,
        );
      }
    }
  }

  async poll_single_mailbox(mailbox: SupportEmailRecord): Promise<void> {
    if (!mailbox.imap_user || !mailbox.imap_password) {
      this.logger.warn(
        `Skipping ${mailbox.email_address}: no IMAP credentials`,
      );
      return;
    }

    const password = decrypt(mailbox.imap_password);
    const client = await this.imap_service.connect(
      mailbox.imap_host,
      mailbox.imap_port,
      mailbox.imap_user,
      password,
    );

    try {
      const { emails, max_uid } = await this.imap_service.fetch_new_emails(
        client,
        mailbox.last_synced_uid,
      );

      this.logger.log(
        `Fetched ${emails.length} new emails for ${mailbox.email_address}`,
      );

      const supabase = this.supabase_service.getClient();

      for (const parsed of emails) {
        // Dedup by message_id
        const { data: existing } = await supabase
          .from('emails')
          .select('id')
          .eq('message_id', parsed.message_id)
          .single();

        if (existing) continue;

        const ai_result = await this.email_ai_service.summarize_and_classify(
          parsed.subject,
          parsed.body_text,
          parsed.from_address,
        );

        const { data: inserted, error: insert_error } = await supabase
          .from('emails')
          .insert({
            support_email_id: mailbox.id,
            message_id: parsed.message_id,
            thread_id: parsed.thread_id,
            from_address: parsed.from_address,
            from_name: parsed.from_name,
            to_addresses: parsed.to_addresses,
            cc_addresses: parsed.cc_addresses,
            bcc_addresses: parsed.bcc_addresses,
            subject: parsed.subject,
            body_text: parsed.body_text,
            body_html: parsed.body_html,
            snippet: parsed.snippet,
            has_attachments: parsed.has_attachments,
            attachments: parsed.attachments,
            internal_date: parsed.internal_date?.toISOString() || null,
            summary: ai_result.summary,
            suggested_team: ai_result.suggested_team,
          })
          .select()
          .single();

        if (insert_error) {
          this.logger.error(
            `Failed to insert email ${parsed.message_id}`,
            insert_error,
          );
          continue;
        }

        const email_dto = inserted as EmailRecord;
        this.email_gateway.emit_new_email_to_inbox(
          mailbox.id,
          email_dto as unknown as EmailResponseDto,
        );
        this.email_gateway.emit_new_email(
          email_dto as unknown as EmailResponseDto,
        );

        this.logger.log(`Ingested email: ${parsed.message_id}`);
      }

      // Update sync cursor
      if (max_uid > mailbox.last_synced_uid) {
        await supabase
          .from('support_emails')
          .update({
            last_synced_uid: max_uid,
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', mailbox.id);
      }
    } finally {
      await this.imap_service.disconnect(client);
    }
  }
}
