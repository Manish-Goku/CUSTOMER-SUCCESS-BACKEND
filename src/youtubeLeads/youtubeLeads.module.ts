import { Module } from '@nestjs/common';
import { YoutubeLeadsController } from './youtubeLeads.controller.js';
import { YoutubeLeadsService } from './youtubeLeads.service.js';

@Module({
  controllers: [YoutubeLeadsController],
  providers: [YoutubeLeadsService],
  exports: [YoutubeLeadsService],
})
export class YoutubeLeadsModule {}
