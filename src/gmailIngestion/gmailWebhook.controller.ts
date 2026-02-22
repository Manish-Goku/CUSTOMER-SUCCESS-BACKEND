import { Controller, Post, Body, HttpCode, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { GmailIngestionService } from './gmailIngestion.service.js';
import { GmailPushNotificationDto } from './dto/gmailPushNotification.dto.js';

@ApiTags('webhooks')
@Controller('webhooks')
export class GmailWebhookController {
  private readonly logger = new Logger(GmailWebhookController.name);

  constructor(
    private readonly gmail_ingestion_service: GmailIngestionService,
  ) {}

  @Post('gmail')
  @HttpCode(200)
  @ApiOperation({ summary: 'Receive Gmail Pub/Sub push notifications' })
  @ApiOkResponse({ description: 'Notification acknowledged' })
  async handle_gmail_push(
    @Body() body: GmailPushNotificationDto,
  ): Promise<{ status: string }> {
    this.logger.log('Received Gmail push notification');

    // Fire-and-forget: Pub/Sub needs 200 fast to avoid retries
    this.gmail_ingestion_service
      .process_push_notification(body)
      .catch((err) => {
        this.logger.error('Error processing push notification', err);
      });

    return { status: 'ok' };
  }
}
