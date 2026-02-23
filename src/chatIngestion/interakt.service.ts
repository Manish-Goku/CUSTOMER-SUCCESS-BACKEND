import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface InteraktSendResult {
  success: boolean;
  response_data?: unknown;
  error?: string;
}

@Injectable()
export class InteraktService {
  private readonly logger = new Logger(InteraktService.name);
  private readonly api_url: string;
  private readonly api_key: string;

  constructor(private readonly config_service: ConfigService) {
    this.api_url = this.config_service.getOrThrow<string>('INTERAKT_API_URL');
    this.api_key = this.config_service.getOrThrow<string>('INTERAKT_API_KEY');
  }

  async send_message(
    phone_number: string,
    message_text: string,
  ): Promise<InteraktSendResult> {
    const url = `${this.api_url}message/`;

    const body = {
      countryCode: phone_number.startsWith('91')
        ? '+91'
        : `+${phone_number.slice(0, 2)}`,
      phoneNumber: phone_number.startsWith('91')
        ? phone_number.slice(2)
        : phone_number,
      type: 'Text',
      data: {
        message: message_text,
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${this.api_key}`,
        },
        body: JSON.stringify(body),
      });

      const response_data = await response.json();

      if (!response.ok) {
        this.logger.error(
          `Interakt API error: ${response.status}`,
          response_data,
        );
        return {
          success: false,
          error: `Interakt API returned ${response.status}`,
          response_data,
        };
      }

      this.logger.log(`Message sent to ${phone_number} via Interakt`);
      return { success: true, response_data };
    } catch (err) {
      this.logger.error(`Failed to send message to ${phone_number}`, err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }
}
