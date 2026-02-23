import { Module } from '@nestjs/common';
import { AgriConsultancyController } from './agriConsultancy.controller.js';
import { AgriConsultancyService } from './agriConsultancy.service.js';

@Module({
  controllers: [AgriConsultancyController],
  providers: [AgriConsultancyService],
  exports: [AgriConsultancyService],
})
export class AgriConsultancyModule {}
