import { Injectable, Logger } from '@nestjs/common';
import { ImapFlow } from 'imapflow';
import { simpleParser, ParsedMail } from 'mailparser';
import { ParsedEmail, AttachmentMeta } from '../common/interfaces/gmailTypes.js';

@Injectable()
export class ImapService {
  private readonly logger = new Logger(ImapService.name);

  async connect(
    host: string,
    port: number,
    user: string,
    password: string,
  ): Promise<ImapFlow> {
    const client = new ImapFlow({
      host,
      port,
      secure: true,
      auth: { user, pass: password },
      logger: false,
    });

    await client.connect();
    return client;
  }

  async fetch_new_emails(
    client: ImapFlow,
    since_uid: number,
  ): Promise<{ emails: ParsedEmail[]; max_uid: number }> {
    const emails: ParsedEmail[] = [];
    let max_uid = since_uid;

    const lock = await client.getMailboxLock('INBOX');
    try {
      const range = since_uid > 0 ? `${since_uid + 1}:*` : '1:*';

      for await (const message of client.fetch(range, {
        uid: true,
        source: true,
      })) {
        // imapflow may return the since_uid itself — skip it
        if (message.uid <= since_uid) continue;

        if (message.uid > max_uid) {
          max_uid = message.uid;
        }

        try {
          if (!message.source) continue;
          const parsed: ParsedMail = await simpleParser(message.source) as ParsedMail;
          emails.push(this.map_parsed_mail(parsed));
        } catch (err) {
          this.logger.error(`Failed to parse message UID ${message.uid}`, err);
        }
      }
    } finally {
      lock.release();
    }

    return { emails, max_uid };
  }

  async disconnect(client: ImapFlow): Promise<void> {
    try {
      await client.logout();
    } catch {
      // ignore disconnect errors
    }
  }

  private map_parsed_mail(mail: ParsedMail): ParsedEmail {
    const from_obj = mail.from?.value?.[0];
    const attachments: AttachmentMeta[] = (mail.attachments || []).map((a) => ({
      attachment_id: a.checksum || '',
      filename: a.filename || 'unknown',
      mime_type: a.contentType || 'application/octet-stream',
      size: a.size || 0,
    }));

    const message_id_header = mail.messageId || '';
    const references = mail.references
      ? (Array.isArray(mail.references) ? mail.references[0] : mail.references)
      : null;

    // Use References/In-Reply-To as thread_id for grouping
    const in_reply_to = mail.inReplyTo || null;
    const thread_id = in_reply_to || references || null;

    return {
      message_id: message_id_header,
      thread_id,
      from_address: from_obj?.address || '',
      from_name: from_obj?.name || null,
      to_addresses: this.extract_addresses(mail.to),
      cc_addresses: this.extract_addresses(mail.cc),
      bcc_addresses: this.extract_addresses(mail.bcc),
      subject: mail.subject || null,
      body_text: mail.text || null,
      body_html: mail.html || null,
      snippet: mail.text ? mail.text.slice(0, 200) : null,
      has_attachments: attachments.length > 0,
      attachments,
      internal_date: mail.date || null,
    };
  }

  private extract_addresses(
    field: ParsedMail['to'],
  ): string[] {
    if (!field) return [];
    const values = Array.isArray(field) ? field : [field];
    return values.flatMap((v) =>
      v.value.map((addr) => addr.address || '').filter(Boolean),
    );
  }
}
