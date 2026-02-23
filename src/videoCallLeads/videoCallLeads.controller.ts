import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';
import { VideoCallLeadsService, VideoCallLeadRow, VideoCallLeadStats } from './videoCallLeads.service.js';
import { CreateVideoCallLeadDto } from './dto/createVideoCallLead.dto.js';
import { UpdateVideoCallLeadDto } from './dto/updateVideoCallLead.dto.js';
import { GetVideoCallLeadsDto } from './dto/getVideoCallLeads.dto.js';

@ApiTags('video-call-leads')
@Controller('video-call-leads')
export class VideoCallLeadsController {
  constructor(
    private readonly video_call_leads_service: VideoCallLeadsService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get video call lead summary statistics' })
  @ApiOkResponse({ description: 'Stats: total, by_status, by_call_type, today_count' })
  async get_stats(): Promise<VideoCallLeadStats> {
    return this.video_call_leads_service.get_stats();
  }

  @Post()
  @ApiOperation({ summary: 'Create a video call lead' })
  @ApiCreatedResponse({ description: 'Video call lead created' })
  async create(@Body() dto: CreateVideoCallLeadDto): Promise<VideoCallLeadRow> {
    return this.video_call_leads_service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List video call leads with filters and pagination' })
  @ApiOkResponse({ description: 'Paginated list of video call leads' })
  async find_all(@Query() dto: GetVideoCallLeadsDto): Promise<{ data: VideoCallLeadRow[]; total: number }> {
    return this.video_call_leads_service.find_all(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single video call lead by ID' })
  @ApiParam({ name: 'id', description: 'Video call lead UUID' })
  async find_one(@Param('id', ParseUUIDPipe) id: string): Promise<VideoCallLeadRow> {
    return this.video_call_leads_service.find_one(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a video call lead' })
  @ApiParam({ name: 'id', description: 'Video call lead UUID' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVideoCallLeadDto,
  ): Promise<VideoCallLeadRow> {
    return this.video_call_leads_service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a video call lead' })
  @ApiParam({ name: 'id', description: 'Video call lead UUID' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ success: boolean; message: string }> {
    return this.video_call_leads_service.remove(id);
  }
}
