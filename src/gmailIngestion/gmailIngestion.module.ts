import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import {
  GmailIngestionController,
  EmailsController,
} from './gmailIngestion.controller.js';
import { GmailWebhookController } from './gmailWebhook.controller.js';
import { GmailIngestionService } from './gmailIngestion.service.js';
import { GmailService } from './gmail.service.js';
import { GmailCronService } from './gmailCron.service.js';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [
    GmailIngestionController,
    EmailsController,
    GmailWebhookController,
  ],
  providers: [GmailIngestionService, GmailService, GmailCronService],
  exports: [GmailIngestionService],
})
export class GmailIngestionModule {}
