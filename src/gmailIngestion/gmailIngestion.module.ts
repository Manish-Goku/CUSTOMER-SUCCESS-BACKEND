import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import {
  GmailIngestionController,
  EmailsController,
} from './gmailIngestion.controller.js';
import { GmailIngestionService } from './gmailIngestion.service.js';
import { ImapService } from './imap.service.js';
import { EmailPollService } from './emailPoll.service.js';
import { EmailAiService } from './emailAi.service.js';
import { SmtpService } from './smtp.service.js';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [GmailIngestionController, EmailsController],
  providers: [GmailIngestionService, ImapService, EmailPollService, EmailAiService, SmtpService],
  exports: [GmailIngestionService],
})
export class GmailIngestionModule {}
