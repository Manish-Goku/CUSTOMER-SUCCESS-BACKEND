import { Module } from '@nestjs/common';
import {
  ConversationsController,
  ChatMessagesController,
} from './chatIngestion.controller.js';
import { ChatWebhookController } from './chatWebhook.controller.js';
import { ChatIngestionService } from './chatIngestion.service.js';
import { InteraktService } from './interakt.service.js';
import { NetcoreService } from './netcore.service.js';
import { ChatAiService } from './chatAi.service.js';
import { ChatGateway } from './chatGateway.gateway.js';

@Module({
  controllers: [
    ConversationsController,
    ChatMessagesController,
    ChatWebhookController,
  ],
  providers: [
    ChatIngestionService,
    InteraktService,
    NetcoreService,
    ChatAiService,
    ChatGateway,
  ],
  exports: [ChatIngestionService],
})
export class ChatIngestionModule {}
