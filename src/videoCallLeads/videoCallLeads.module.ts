import { Module } from '@nestjs/common';
import { VideoCallLeadsController } from './videoCallLeads.controller.js';
import { VideoCallLeadsService } from './videoCallLeads.service.js';

@Module({
  controllers: [VideoCallLeadsController],
  providers: [VideoCallLeadsService],
  exports: [VideoCallLeadsService],
})
export class VideoCallLeadsModule {}
