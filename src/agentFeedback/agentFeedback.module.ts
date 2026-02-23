import { Module } from '@nestjs/common';
import { AgentFeedbackController } from './agentFeedback.controller.js';
import { AgentFeedbackService } from './agentFeedback.service.js';

@Module({
  controllers: [AgentFeedbackController],
  providers: [AgentFeedbackService],
  exports: [AgentFeedbackService],
})
export class AgentFeedbackModule {}
