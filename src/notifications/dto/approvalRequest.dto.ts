import { IsString, IsOptional, IsIn, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

const APPROVAL_TYPES = [
  'early_clockout',
  'leave_request',
  'ticket_escalation',
  'refund_approval',
  'call_transfer',
] as const;

const APPROVAL_STATUSES = ['pending', 'approved', 'rejected'] as const;

export class GetApprovalRequestsDto {
  @IsOptional()
  @IsIn(APPROVAL_STATUSES)
  status?: string;

  @IsOptional()
  @IsIn(APPROVAL_TYPES)
  type?: string;

  @IsOptional()
  @IsString()
  requested_by?: string;

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

export class ApproveRequestDto {
  @IsString()
  reviewed_by: string;

  @IsOptional()
  @IsString()
  comments?: string;
}

export class RejectRequestDto {
  @IsString()
  reviewed_by: string;

  @IsString()
  comments: string;
}
