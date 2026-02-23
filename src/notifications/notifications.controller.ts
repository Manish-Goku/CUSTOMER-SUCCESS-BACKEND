import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Param,
  Body,
  Query,
  Logger,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import {
  CreateNotificationDto,
  GetNotificationsDto,
  UpdateNotificationDto,
  MarkAllReadDto,
} from './dto/notification.dto.js';
import {
  GetApprovalRequestsDto,
  ApproveRequestDto,
  RejectRequestDto,
} from './dto/approvalRequest.dto.js';
import { UpsertPreferencesDto } from './dto/notificationPreference.dto.js';

@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notifications_service: NotificationsService) {}

  @Post()
  async create(@Body() dto: CreateNotificationDto) {
    return this.notifications_service.create_notification(dto);
  }

  @Get()
  async find_all(@Query() dto: GetNotificationsDto) {
    return this.notifications_service.find_all_notifications(dto);
  }

  @Get('unread-count/:user_id')
  async get_unread_count(@Param('user_id') user_id: string) {
    return this.notifications_service.get_unread_count(user_id);
  }

  @Patch('mark-all-read')
  async mark_all_read(@Body() dto: MarkAllReadDto) {
    return this.notifications_service.mark_all_read(dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateNotificationDto,
  ) {
    return this.notifications_service.update_notification(id, dto);
  }

  @Get('approval-requests')
  async find_all_approval_requests(@Query() dto: GetApprovalRequestsDto) {
    return this.notifications_service.find_all_approval_requests(dto);
  }

  @Post('approval-requests/:id/approve')
  async approve_request(
    @Param('id') id: string,
    @Body() dto: ApproveRequestDto,
  ) {
    return this.notifications_service.approve_request(id, dto);
  }

  @Post('approval-requests/:id/reject')
  async reject_request(
    @Param('id') id: string,
    @Body() dto: RejectRequestDto,
  ) {
    return this.notifications_service.reject_request(id, dto);
  }

  @Get('preferences/:user_id')
  async get_preferences(@Param('user_id') user_id: string) {
    return this.notifications_service.get_preferences(user_id);
  }

  @Put('preferences/:user_id')
  async upsert_preferences(
    @Param('user_id') user_id: string,
    @Body() dto: UpsertPreferencesDto,
  ) {
    return this.notifications_service.upsert_preferences(user_id, dto);
  }
}
