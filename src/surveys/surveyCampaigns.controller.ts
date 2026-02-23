import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SurveyCampaignsService } from './surveyCampaigns.service.js';
import { CreateSurveyCampaignDto, UpdateSurveyCampaignDto } from './dto/createSurveyCampaign.dto.js';

@ApiTags('survey-campaigns')
@Controller('survey-campaigns')
export class SurveyCampaignsController {
  constructor(private readonly survey_campaigns_service: SurveyCampaignsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a survey campaign' })
  async create(@Body() dto: CreateSurveyCampaignDto) {
    return this.survey_campaigns_service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all survey campaigns' })
  async find_all() {
    return this.survey_campaigns_service.find_all();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a survey campaign' })
  async find_one(@Param('id', ParseUUIDPipe) id: string) {
    return this.survey_campaigns_service.find_one(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a survey campaign' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSurveyCampaignDto,
  ) {
    return this.survey_campaigns_service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a survey campaign' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.survey_campaigns_service.remove(id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a campaign' })
  async activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.survey_campaigns_service.toggle_status(id, 'active');
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause a campaign' })
  async pause(@Param('id', ParseUUIDPipe) id: string) {
    return this.survey_campaigns_service.toggle_status(id, 'paused');
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete a campaign' })
  async complete(@Param('id', ParseUUIDPipe) id: string) {
    return this.survey_campaigns_service.toggle_status(id, 'completed');
  }
}
