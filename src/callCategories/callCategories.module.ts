import { Module } from '@nestjs/common';
import { CallCategoriesController } from './callCategories.controller.js';
import { CallCategoriesService } from './callCategories.service.js';

@Module({
  controllers: [CallCategoriesController],
  providers: [CallCategoriesService],
  exports: [CallCategoriesService],
})
export class CallCategoriesModule {}
