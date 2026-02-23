import { Injectable, Logger } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';

export interface SmtpSendOptions {
  from: string;
  to: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  text: string;
  html?: string;
  in_reply_to?: string;
  references?: string;
}

@Injectable()
export class SmtpService {
  private readonly logger = new Logger(SmtpService.name);

  async send_email(
    smtp_user: string,
    smtp_password: string,
    options: SmtpSendOptions,
  ): Promise<{ message_id: string }> {
    const transport: Transporter = createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: smtp_user, pass: smtp_password },
    });

    const mail_options: Record<string, unknown> = {
      from: options.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
    };

    if (options.cc?.length) {
      mail_options.cc = options.cc;
    }

    if (options.bcc?.length) {
      mail_options.bcc = options.bcc;
    }

    if (options.html) {
      mail_options.html = options.html;
    }

    if (options.in_reply_to) {
      mail_options.inReplyTo = options.in_reply_to;
      mail_options.references = options.references || options.in_reply_to;
    }

    const info = await transport.sendMail(mail_options);
    this.logger.log(`Email sent via SMTP: ${info.messageId}`);

    return { message_id: info.messageId };
  }
}
