import { Controller, Post, Body, HttpCode, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { ChatIngestionService } from './chatIngestion.service.js';
import { InteraktWebhookDto } from './dto/interaktWebhook.dto.js';

@ApiTags('webhooks')
@Controller('webhooks')
export class ChatWebhookController {
  private readonly logger = new Logger(ChatWebhookController.name);

  constructor(
    private readonly chat_ingestion_service: ChatIngestionService,
  ) {}

  @Post('interakt')
  @HttpCode(200)
  @ApiOperation({ summary: 'Receive Interakt/WhatsApp webhook events' })
  @ApiOkResponse({ description: 'Webhook acknowledged' })
  async handle_interakt_webhook(
    @Body() body: InteraktWebhookDto,
  ): Promise<{ status: string }> {
    this.logger.log(`Received Interakt webhook: ${body.type}`);

    // Fire-and-forget: return 200 fast to avoid retries
    this.chat_ingestion_service.process_webhook(body).catch((err) => {
      this.logger.error('Error processing Interakt webhook', err);
    });

    return { status: 'ok' };
  }
}
