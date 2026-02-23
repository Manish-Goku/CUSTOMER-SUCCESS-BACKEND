import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SurveyCallsService } from './surveyCalls.service.js';
import { CompleteSurveyCallDto, ScheduleSurveyCallDto } from './dto/updateSurveyCall.dto.js';

@ApiTags('survey-calls')
@Controller('survey-calls')
export class SurveyCallsController {
  constructor(private readonly survey_calls_service: SurveyCallsService) {}

  @Get('campaign/:campaign_id')
  @ApiOperation({ summary: 'Get calls for a campaign' })
  async find_by_campaign(@Param('campaign_id', ParseUUIDPipe) campaign_id: string) {
    return this.survey_calls_service.find_by_campaign(campaign_id);
  }

  @Get('analytics/:campaign_id')
  @ApiOperation({ summary: 'Get campaign analytics' })
  async get_analytics(@Param('campaign_id', ParseUUIDPipe) campaign_id: string) {
    return this.survey_calls_service.get_analytics(campaign_id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete a survey call with responses' })
  async complete_call(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteSurveyCallDto,
  ) {
    return this.survey_calls_service.complete_call(id, dto);
  }

  @Post(':id/not-answered')
  @ApiOperation({ summary: 'Mark a call as not answered' })
  async mark_not_answered(@Param('id', ParseUUIDPipe) id: string) {
    return this.survey_calls_service.mark_not_answered(id);
  }

  @Post(':id/schedule')
  @ApiOperation({ summary: 'Schedule a call for later' })
  async schedule_call(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ScheduleSurveyCallDto,
  ) {
    return this.survey_calls_service.schedule_call(id, dto);
  }
}
