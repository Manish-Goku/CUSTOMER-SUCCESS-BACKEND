import { Module } from '@nestjs/common';
import { AuditsController } from './audits.controller.js';
import { AuditsService } from './audits.service.js';

@Module({
  controllers: [AuditsController],
  providers: [AuditsService],
  exports: [AuditsService],
})
export class AuditsModule {}
