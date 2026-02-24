import { Controller, Post, Body, HttpCode, Logger, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { ChatIngestionService } from './chatIngestion.service.js';
import { InteraktWebhookDto } from './dto/interaktWebhook.dto.js';
import { NetcoreWebhookDto } from './dto/netcoreWebhook.dto.js';

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

  @Post('interact/:slug')
  @HttpCode(200)
  @ApiOperation({ summary: 'Receive Interact provider webhook events (dynamic)' })
  @ApiOkResponse({ description: 'Webhook acknowledged' })
  async handle_interact_webhook(
    @Param('slug') slug: string,
    @Body() body: InteraktWebhookDto,
  ): Promise<{ status: string }> {
    this.logger.log(`Received Interact webhook for provider: ${slug}`);

    this.chat_ingestion_service
      .process_interact_webhook(slug, body)
      .catch((err) => {
        this.logger.error(`Error processing Interact webhook [${slug}]`, err);
      });

    return { status: 'ok' };
  }

  @Post('netcore')
  @HttpCode(200)
  @ApiOperation({ summary: 'Receive Netcore/WhatsApp webhook events' })
  @ApiOkResponse({ description: 'Webhook acknowledged' })
  async handle_netcore_webhook(
    @Body() body: NetcoreWebhookDto,
  ): Promise<{ status: string }> {
    this.logger.log(
      `Received Netcore webhook: ${body.incoming_message?.length || 0} messages`,
    );

    // Fire-and-forget: return 200 fast to avoid retries
    this.chat_ingestion_service.process_netcore_webhook(body).catch((err) => {
      this.logger.error('Error processing Netcore webhook', err);
    });

    return { status: 'ok' };
  }
}
