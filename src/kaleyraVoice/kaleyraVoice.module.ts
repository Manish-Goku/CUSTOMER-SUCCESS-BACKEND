import { Module } from '@nestjs/common';
import { KaleyraVoiceController } from './kaleyraVoice.controller.js';
import { KaleyraVoiceService } from './kaleyraVoice.service.js';

@Module({
  controllers: [KaleyraVoiceController],
  providers: [KaleyraVoiceService],
})
export class KaleyraVoiceModule {}
