import { Module } from '@nestjs/common';
import { ReturnRcaController } from './returnRca.controller.js';
import { ReturnRcaService } from './returnRca.service.js';

@Module({
  controllers: [ReturnRcaController],
  providers: [ReturnRcaService],
  exports: [ReturnRcaService],
})
export class ReturnRcaModule {}
