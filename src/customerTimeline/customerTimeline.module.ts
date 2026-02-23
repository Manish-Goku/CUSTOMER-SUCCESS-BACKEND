import { Module } from '@nestjs/common';
import { CustomerTimelineController } from './customerTimeline.controller.js';
import { CustomerTimelineService } from './customerTimeline.service.js';

@Module({
  controllers: [CustomerTimelineController],
  providers: [CustomerTimelineService],
  exports: [CustomerTimelineService],
})
export class CustomerTimelineModule {}
