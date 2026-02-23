import { Module } from '@nestjs/common';
import { CustomerFeedbackController } from './customerFeedback.controller.js';
import { CustomerFeedbackService } from './customerFeedback.service.js';

@Module({
  controllers: [CustomerFeedbackController],
  providers: [CustomerFeedbackService],
  exports: [CustomerFeedbackService],
})
export class CustomerFeedbackModule {}
