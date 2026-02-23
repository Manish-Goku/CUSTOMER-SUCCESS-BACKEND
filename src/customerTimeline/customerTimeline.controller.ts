import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CustomerTimelineService } from './customerTimeline.service.js';
import { CreateTimelineEventDto } from './dto/createTimelineEvent.dto.js';
import {
  GetTimelineDto,
  TimelineEventResponseDto,
  TimelineSummary,
} from './dto/getTimeline.dto.js';

@ApiTags('customer-timeline')
@Controller('customer-timeline')
export class CustomerTimelineController {
  constructor(
    private readonly customer_timeline_service: CustomerTimelineService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a timeline event' })
  @ApiCreatedResponse({ description: 'Timeline event created' })
  async create(
    @Body() dto: CreateTimelineEventDto,
  ): Promise<TimelineEventResponseDto> {
    return this.customer_timeline_service.create(dto);
  }

  @Get(':mobile_number')
  @ApiOperation({ summary: 'Get all events for a customer (ordered by created_at DESC)' })
  @ApiParam({ name: 'mobile_number', description: 'Customer mobile number' })
  @ApiOkResponse({ description: 'Paginated list of timeline events' })
  async find_by_mobile(
    @Param('mobile_number') mobile_number: string,
    @Query() dto: GetTimelineDto,
  ): Promise<{ data: TimelineEventResponseDto[]; total: number }> {
    return this.customer_timeline_service.find_by_mobile(mobile_number, dto);
  }

  @Get(':mobile_number/summary')
  @ApiOperation({ summary: 'Get event counts by type for a customer' })
  @ApiParam({ name: 'mobile_number', description: 'Customer mobile number' })
  @ApiOkResponse({ description: 'Event type counts' })
  async get_summary(
    @Param('mobile_number') mobile_number: string,
  ): Promise<TimelineSummary[]> {
    return this.customer_timeline_service.get_summary(mobile_number);
  }
}
