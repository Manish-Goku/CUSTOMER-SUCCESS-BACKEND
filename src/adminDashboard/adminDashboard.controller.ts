import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminDashboardService } from './adminDashboard.service.js';
import { DashboardQueryDto } from './dto/dashboardQuery.dto.js';
import {
  DailyVolumeDto,
  DashboardOverviewDto,
  MailboxCountDto,
  TeamCountDto,
  TopSenderDto,
} from './dto/dashboardResponse.dto.js';

@ApiTags('admin-dashboard')
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly dashboard_service: AdminDashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'All dashboard metrics combined (parallel)' })
  @ApiOkResponse({ type: DashboardOverviewDto })
  async get_overview(@Query() dto: DashboardQueryDto): Promise<DashboardOverviewDto> {
    return this.dashboard_service.get_overview(dto);
  }

  @Get('email-volume')
  @ApiOperation({ summary: 'Total email count in date range' })
  @ApiOkResponse({ type: Number })
  async get_email_volume(@Query() dto: DashboardQueryDto): Promise<number> {
    return this.dashboard_service.get_email_volume(dto);
  }

  @Get('emails-by-team')
  @ApiOperation({ summary: 'Email count grouped by suggested team' })
  @ApiOkResponse({ type: [TeamCountDto] })
  async get_emails_by_team(@Query() dto: DashboardQueryDto): Promise<TeamCountDto[]> {
    return this.dashboard_service.get_emails_by_team(dto);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Unread email count in date range' })
  @ApiOkResponse({ type: Number })
  async get_unread_count(@Query() dto: DashboardQueryDto): Promise<number> {
    return this.dashboard_service.get_unread_count(dto);
  }

  @Get('top-senders')
  @ApiOperation({ summary: 'Top email senders by volume' })
  @ApiOkResponse({ type: [TopSenderDto] })
  async get_top_senders(@Query() dto: DashboardQueryDto): Promise<TopSenderDto[]> {
    return this.dashboard_service.get_top_senders(dto);
  }

  @Get('daily-volume')
  @ApiOperation({ summary: 'Daily email volume trend (IST)' })
  @ApiOkResponse({ type: [DailyVolumeDto] })
  async get_daily_volume(@Query() dto: DashboardQueryDto): Promise<DailyVolumeDto[]> {
    return this.dashboard_service.get_daily_volume(dto);
  }

  @Get('emails-by-mailbox')
  @ApiOperation({ summary: 'Email count per monitored mailbox' })
  @ApiOkResponse({ type: [MailboxCountDto] })
  async get_emails_by_mailbox(@Query() dto: DashboardQueryDto): Promise<MailboxCountDto[]> {
    return this.dashboard_service.get_emails_by_mailbox(dto);
  }
}
