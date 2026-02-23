import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsArray,
  IsIn,
  IsBoolean,
  IsDateString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

const STATUSES = [
  'pending',
  'under_review',
  'approved',
  'partially_approved',
  'rejected',
  'processed',
  'closed',
] as const;
const DEPARTMENTS = ['Support', 'QC', 'Finance', 'Manager'] as const;
const FINAL_ACTIONS = ['refund', 'replacement', 'exchange', 'rejected', 'partial_refund'] as const;

export class UpdateRefundDto {
  @ApiPropertyOptional({ enum: STATUSES })
  @IsOptional()
  @IsIn(STATUSES)
  status?: string;

  @ApiPropertyOptional({ enum: DEPARTMENTS })
  @IsOptional()
  @IsIn(DEPARTMENTS)
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assigned_to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assigned_to_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ticket_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customer_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customer_phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customer_email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customer_pin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customer_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  order_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cod_amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  prepaid_amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total_amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payment_mode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  utr_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discount_value?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discount_percent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  coins_used?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  product_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  product_sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  batch_no?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  product_used?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  request_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  issue_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  additional_comment?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  product_image_urls?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invoice_image_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  product_video_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unboxing_video_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unboxing_video_source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requested_by?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requested_department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cn_number?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  order_status?: string;

  @ApiPropertyOptional({ enum: FINAL_ACTIONS })
  @IsOptional()
  @IsIn(FINAL_ACTIONS)
  final_action?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  final_decision?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  final_decision_by?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  final_decision_at?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sla_hours?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  sla_breach_at?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_sla_breached?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  closed_at?: string;
}
