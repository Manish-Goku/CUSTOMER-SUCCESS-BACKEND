import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { YoutubeLeadsService } from './youtubeLeads.service.js';
import { CreateYoutubeLeadDto, UpdateYoutubeLeadDto } from './dto/createYoutubeLead.dto.js';
import { GetYoutubeLeadsDto } from './dto/getYoutubeLeads.dto.js';
import { ActionYoutubeLeadDto, BulkAssignYoutubeLeadDto } from './dto/actionYoutubeLead.dto.js';

@ApiTags('youtube-leads')
@Controller('youtube-leads')
export class YoutubeLeadsController {
  constructor(private readonly youtube_leads_service: YoutubeLeadsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a YouTube lead' })
  async create(@Body() dto: CreateYoutubeLeadDto) {
    return this.youtube_leads_service.create(dto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get lead statistics' })
  async get_stats() {
    return this.youtube_leads_service.get_stats();
  }

  @Get()
  @ApiOperation({ summary: 'List YouTube leads with filters' })
  async find_all(@Query() dto: GetYoutubeLeadsDto) {
    return this.youtube_leads_service.find_all(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a YouTube lead' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateYoutubeLeadDto,
  ) {
    return this.youtube_leads_service.update(id, dto);
  }

  @Post(':id/action')
  @ApiOperation({ summary: 'Perform an action on a lead (appends notes)' })
  async action(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActionYoutubeLeadDto,
  ) {
    return this.youtube_leads_service.action(id, dto);
  }

  @Post('bulk-assign')
  @ApiOperation({ summary: 'Bulk assign leads to an agent' })
  async bulk_assign(@Body() dto: BulkAssignYoutubeLeadDto) {
    return this.youtube_leads_service.bulk_assign(dto);
  }
}
