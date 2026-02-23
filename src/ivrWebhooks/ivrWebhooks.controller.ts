import {
  Controller,
  Post,
  Param,
  Headers,
  Body,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { IvrWebhooksService } from './ivrWebhooks.service.js';

@ApiTags('webhooks')
@Controller('webhooks/ivr')
export class IvrWebhooksController {
  private readonly logger = new Logger(IvrWebhooksController.name);

  constructor(private readonly ivr_webhooks_service: IvrWebhooksService) {}

  @Post(':slug')
  @HttpCode(200)
  @ApiOperation({ summary: 'Receive IVR provider webhook events' })
  @ApiOkResponse({ description: 'Webhook acknowledged' })
  async handle_ivr_webhook(
    @Param('slug') slug: string,
    @Headers('x-api-key') api_key: string,
    @Body() body: Record<string, unknown>,
  ): Promise<{ status: string }> {
    this.logger.log(`Received IVR webhook for provider: ${slug}`);

    // Fire-and-forget: return 200 fast to avoid retries
    this.ivr_webhooks_service
      .process_webhook(slug, api_key, body)
      .catch((err) => {
        this.logger.error(`Error processing IVR webhook [${slug}]`, err);
      });

    return { status: 'ok' };
  }
}
