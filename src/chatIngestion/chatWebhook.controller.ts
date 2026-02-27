import { Controller, Post, Body, HttpCode, Logger, Param, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { ChatIngestionService } from './chatIngestion.service.js';
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
    @Req() req: any,
  ): Promise<{ status: string }> {
    const body = req.body;
    this.logger.log(`[RAW INTERAKT WEBHOOK] ${JSON.stringify(body)}`);

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
    @Req() req: any,
  ): Promise<{ status: string }> {
    const body = req.body;
    this.logger.log(`[RAW INTERACT WEBHOOK] slug=${slug} payload=${JSON.stringify(body)}`);

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
