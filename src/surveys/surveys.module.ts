import { Module } from '@nestjs/common';
import { SurveyTemplatesController } from './surveyTemplates.controller.js';
import { SurveyTemplatesService } from './surveyTemplates.service.js';
import { SurveyCampaignsController } from './surveyCampaigns.controller.js';
import { SurveyCampaignsService } from './surveyCampaigns.service.js';
import { SurveyCallsController } from './surveyCalls.controller.js';
import { SurveyCallsService } from './surveyCalls.service.js';

@Module({
  controllers: [
    SurveyTemplatesController,
    SurveyCampaignsController,
    SurveyCallsController,
  ],
  providers: [
    SurveyTemplatesService,
    SurveyCampaignsService,
    SurveyCallsService,
  ],
  exports: [SurveyTemplatesService, SurveyCampaignsService, SurveyCallsService],
})
export class SurveysModule {}
