import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, gmail_v1 } from 'googleapis';
import { JWT } from 'google-auth-library';
import { ParsedEmail, AttachmentMeta } from '../common/interfaces/gmailTypes.js';

@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);
  private readonly pubsub_topic: string;
  private readonly service_account_email: string;
  private readonly private_key: string;

  constructor(private readonly config_service: ConfigService) {
    this.service_account_email = this.config_service.getOrThrow<string>(
      'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    );
    this.private_key = this.config_service
      .getOrThrow<string>('GOOGLE_PRIVATE_KEY')
      .replace(/\\n/g, '\n');
    this.pubsub_topic = this.config_service.getOrThrow<string>(
      'GMAIL_PUBSUB_TOPIC',
    );
  }

  private get_auth_client(user_email: string): JWT {
    return new JWT({
      email: this.service_account_email,
      key: this.private_key,
      scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
      subject: user_email,
    });
  }

  private get_gmail_client(user_email: string): gmail_v1.Gmail {
    const auth = this.get_auth_client(user_email);
    return google.gmail({ version: 'v1', auth });
  }

  async setup_watch(
    user_email: string,
  ): Promise<{ expiration: string; history_id: string }> {
    const gmail = this.get_gmail_client(user_email);
    const response = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        topicName: this.pubsub_topic,
        labelIds: ['INBOX'],
      },
    });

    this.logger.log(`Watch started for ${user_email}, expires: ${response.data.expiration}`);

    return {
      expiration: response.data.expiration!,
      history_id: response.data.historyId!,
    };
  }

  async stop_watch(user_email: string): Promise<void> {
    const gmail = this.get_gmail_client(user_email);
    await gmail.users.stop({ userId: 'me' });
    this.logger.log(`Watch stopped for ${user_email}`);
  }

  async get_new_messages(
    user_email: string,
    start_history_id: string,
  ): Promise<string[]> {
    const gmail = this.get_gmail_client(user_email);
    const message_ids: string[] = [];

    let page_token: string | undefined;
    do {
      const response = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: start_history_id,
        historyTypes: ['messageAdded'],
        pageToken: page_token,
      });

      const history_records = response.data.history || [];
      for (const record of history_records) {
        const added_messages = record.messagesAdded || [];
        for (const msg of added_messages) {
          if (msg.message?.id) {
            message_ids.push(msg.message.id);
          }
        }
      }
      page_token = response.data.nextPageToken ?? undefined;
    } while (page_token);

    return [...new Set(message_ids)];
  }

  async get_message(
    user_email: string,
    message_id: string,
  ): Promise<ParsedEmail> {
    const gmail = this.get_gmail_client(user_email);
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: message_id,
      format: 'full',
    });
    return this.parse_message(response.data);
  }

  private parse_message(message: gmail_v1.Schema$Message): ParsedEmail {
    const headers = message.payload?.headers || [];
    const get_header = (name: string): string =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
        ?.value || '';

    const body_parts = this.extract_body_parts(message.payload);
    const attachments = this.extract_attachments(message.payload);

    return {
      gmail_message_id: message.id!,
      thread_id: message.threadId || null,
      history_id: message.historyId || null,
      from_address: this.extract_email_address(get_header('From')),
      from_name: this.extract_display_name(get_header('From')),
      to_addresses: this.parse_address_list(get_header('To')),
      cc_addresses: this.parse_address_list(get_header('Cc')),
      bcc_addresses: this.parse_address_list(get_header('Bcc')),
      subject: get_header('Subject') || null,
      body_text: body_parts.text,
      body_html: body_parts.html,
      snippet: message.snippet || null,
      label_ids: message.labelIds || [],
      has_attachments: attachments.length > 0,
      attachments,
      internal_date: message.internalDate
        ? new Date(parseInt(message.internalDate))
        : null,
    };
  }

  private extract_body_parts(
    payload: gmail_v1.Schema$MessagePart | undefined,
  ): { text: string | null; html: string | null } {
    let text: string | null = null;
    let html: string | null = null;

    if (!payload) return { text, html };

    if (payload.mimeType === 'text/plain' && payload.body?.data) {
      text = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    } else if (payload.mimeType === 'text/html' && payload.body?.data) {
      html = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        const nested = this.extract_body_parts(part);
        if (nested.text && !text) text = nested.text;
        if (nested.html && !html) html = nested.html;
      }
    }

    return { text, html };
  }

  private extract_attachments(
    payload: gmail_v1.Schema$MessagePart | undefined,
  ): AttachmentMeta[] {
    const attachments: AttachmentMeta[] = [];

    if (!payload) return attachments;

    if (payload.filename && payload.filename.length > 0 && payload.body) {
      attachments.push({
        attachment_id: payload.body.attachmentId || '',
        filename: payload.filename,
        mime_type: payload.mimeType || 'application/octet-stream',
        size: payload.body.size || 0,
      });
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        attachments.push(...this.extract_attachments(part));
      }
    }

    return attachments;
  }

  private extract_email_address(raw: string): string {
    const match = raw.match(/<([^>]+)>/);
    return match ? match[1] : raw.trim();
  }

  private extract_display_name(raw: string): string | null {
    const match = raw.match(/^(.+?)\s*<[^>]+>/);
    if (match) {
      return match[1].replace(/^["']|["']$/g, '').trim() || null;
    }
    return null;
  }

  private parse_address_list(raw: string): string[] {
    if (!raw) return [];
    return raw
      .split(',')
      .map((addr) => this.extract_email_address(addr.trim()))
      .filter((addr) => addr.length > 0);
  }
}
