import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { SupabaseModule } from './supabase/supabase.module.js';
import { GmailIngestionModule } from './gmailIngestion/gmailIngestion.module.js';
import { EmailGatewayModule } from './emailGateway/emailGateway.module.js';
import { AdminDashboardModule } from './adminDashboard/adminDashboard.module.js';
import { ChatIngestionModule } from './chatIngestion/chatIngestion.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    GmailIngestionModule,
    EmailGatewayModule,
    AdminDashboardModule,
    ChatIngestionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
