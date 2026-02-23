import { Module } from '@nestjs/common';
import { IvrWebhooksController } from './ivrWebhooks.controller.js';
import { IvrWebhooksService } from './ivrWebhooks.service.js';

@Module({
  controllers: [IvrWebhooksController],
  providers: [IvrWebhooksService],
})
export class IvrWebhooksModule {}
