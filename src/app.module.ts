import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { SupabaseModule } from './supabase/supabase.module.js';
import { GmailIngestionModule } from './gmailIngestion/gmailIngestion.module.js';
import { EmailGatewayModule } from './emailGateway/emailGateway.module.js';
import { AdminDashboardModule } from './adminDashboard/adminDashboard.module.js';
import { ChatIngestionModule } from './chatIngestion/chatIngestion.module.js';
import { ChatTemplatesModule } from './chatTemplates/chatTemplates.module.js';
import { QueryAssignmentsModule } from './queryAssignments/queryAssignments.module.js';
import { IvrWebhooksModule } from './ivrWebhooks/ivrWebhooks.module.js';
import { KaleyraVoiceModule } from './kaleyraVoice/kaleyraVoice.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { SlaConfigModule } from './slaConfig/slaConfig.module.js';
import { AgentsModule } from './agents/agents.module.js';
import { RolesModule } from './roles/roles.module.js';
import { RefundsModule } from './refunds/refunds.module.js';
import { AuditsModule } from './audits/audits.module.js';
import { VideoCallLeadsModule } from './videoCallLeads/videoCallLeads.module.js';
import { CallCategoriesModule } from './callCategories/callCategories.module.js';
import { CustomerTimelineModule } from './customerTimeline/customerTimeline.module.js';
import { AgentFeedbackModule } from './agentFeedback/agentFeedback.module.js';
import { TicketsModule } from './tickets/tickets.module.js';
import { SurveysModule } from './surveys/surveys.module.js';
import { WorkflowsModule } from './workflows/workflows.module.js';
import { YoutubeLeadsModule } from './youtubeLeads/youtubeLeads.module.js';
import { CustomerFeedbackModule } from './customerFeedback/customerFeedback.module.js';
import { ReturnRcaModule } from './returnRca/returnRca.module.js';
import { AgriConsultancyModule } from './agriConsultancy/agriConsultancy.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    GmailIngestionModule,
    EmailGatewayModule,
    AdminDashboardModule,
    ChatIngestionModule,
    ChatTemplatesModule,
    QueryAssignmentsModule,
    IvrWebhooksModule,
    KaleyraVoiceModule,
    NotificationsModule,
    SlaConfigModule,
    AgentsModule,
    RolesModule,
    RefundsModule,
    AuditsModule,
    VideoCallLeadsModule,
    CallCategoriesModule,
    CustomerTimelineModule,
    AgentFeedbackModule,
    TicketsModule,
    SurveysModule,
    WorkflowsModule,
    YoutubeLeadsModule,
    CustomerFeedbackModule,
    ReturnRcaModule,
    AgriConsultancyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
