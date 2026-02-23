import {
  IsString,
  IsOptional,
  IsBoolean,
  IsIn,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

const NOTIFICATION_TYPES = [
  'approval_request',
  'sla_breach',
  'missed_call',
  'escalation',
  'assignment',
  'system',
  'feedback',
  'early_clockout',
] as const;

const PRIORITY_LEVELS = ['low', 'normal', 'high', 'urgent'] as const;
const STATUS_VALUES = ['unread', 'read', 'actioned', 'dismissed'] as const;
const REFERENCE_TYPES = [
  'call',
  'ticket',
  'chat',
  'agent',
  'workflow',
] as const;

export class CreateNotificationDto {
  @IsIn(NOTIFICATION_TYPES)
  type: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsIn(PRIORITY_LEVELS)
  priority?: string;

  @IsOptional()
  @IsString()
  reference_id?: string;

  @IsOptional()
  @IsIn(REFERENCE_TYPES)
  reference_type?: string;

  @IsOptional()
  @IsString()
  from_user?: string;

  @IsString()
  to_user: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  requires_approval?: boolean;

  // Fields for auto-creating an approval_request
  @IsOptional()
  @IsString()
  approval_type?: string;

  @IsOptional()
  @IsString()
  requested_by?: string;

  @IsOptional()
  @IsString()
  requested_by_name?: string;

  @IsOptional()
  @IsString()
  approval_reason?: string;
}

export class GetNotificationsDto {
  @IsOptional()
  @IsIn(NOTIFICATION_TYPES)
  type?: string;

  @IsOptional()
  @IsIn(STATUS_VALUES)
  status?: string;

  @IsOptional()
  @IsIn(PRIORITY_LEVELS)
  priority?: string;

  @IsOptional()
  @IsString()
  to_user?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class UpdateNotificationDto {
  @IsIn(STATUS_VALUES)
  status: string;
}

export class MarkAllReadDto {
  @IsString()
  to_user: string;
}
