import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface NetcoreSendResult {
  success: boolean;
  response_data?: unknown;
  error?: string;
}

@Injectable()
export class NetcoreService {
  private readonly logger = new Logger(NetcoreService.name);
  private readonly api_url: string;
  private readonly api_key: string;

  constructor(private readonly config_service: ConfigService) {
    this.api_url = this.config_service.get<string>('NETCORE_API_URL', '');
    this.api_key = this.config_service.get<string>('NETCORE_API_KEY', '');

    if (!this.api_url || !this.api_key) {
      this.logger.warn(
        'NETCORE_API_URL or NETCORE_API_KEY not set — outbound Netcore messages will fail',
      );
    }
  }

  async send_message(
    phone_number: string,
    message_text: string,
  ): Promise<NetcoreSendResult> {
    if (!this.api_url || !this.api_key) {
      return {
        success: false,
        error: 'Netcore API credentials not configured',
      };
    }

    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: phone_number,
      type: 'text',
      text: {
        body: message_text,
      },
    };

    try {
      const response = await fetch(this.api_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.api_key}`,
        },
        body: JSON.stringify(body),
      });

      const response_data = await response.json();

      if (!response.ok) {
        this.logger.error(
          `Netcore API error: ${response.status}`,
          response_data,
        );
        return {
          success: false,
          error: `Netcore API returned ${response.status}`,
          response_data,
        };
      }

      this.logger.log(`Message sent to ${phone_number} via Netcore`);
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
