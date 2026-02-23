import { Module } from '@nestjs/common';
import { AdminDashboardController } from './adminDashboard.controller.js';
import { AdminDashboardService } from './adminDashboard.service.js';

@Module({
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
})
export class AdminDashboardModule {}
