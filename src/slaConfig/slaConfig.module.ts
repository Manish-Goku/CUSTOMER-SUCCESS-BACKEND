import { Module } from '@nestjs/common';
import { SlaConfigController } from './slaConfig.controller.js';
import { SlaConfigService } from './slaConfig.service.js';

@Module({
  controllers: [SlaConfigController],
  providers: [SlaConfigService],
  exports: [SlaConfigService],
})
export class SlaConfigModule {}
