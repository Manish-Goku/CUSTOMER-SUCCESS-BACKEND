import { Module } from '@nestjs/common';
import { ChatTemplatesController } from './chatTemplates.controller.js';
import { ChatTemplatesService } from './chatTemplates.service.js';

@Module({
  controllers: [ChatTemplatesController],
  providers: [ChatTemplatesService],
  exports: [ChatTemplatesService],
})
export class ChatTemplatesModule {}
