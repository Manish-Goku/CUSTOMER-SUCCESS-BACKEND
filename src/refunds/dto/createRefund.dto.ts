import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsArray,
  IsIn,
  Min,
  IsDateString,
  IsUUID,
  ValidateNested,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

const REQUEST_TYPES = ['refund', 'replacement', 'exchange'] as const;
const ISSUE_TYPES = [
  'damaged',
  'wrong_product',
  'expired',
  'quality',
  'missing_items',
  'others',
] as const;
const UNBOXING_VIDEO_SOURCES = ['google_drive', 'youtube', 'direct'] as const;
const DEPARTMENTS = ['Support', 'QC', 'Finance', 'Manager'] as const;

export class CreateRefundProductDto {
  @ApiProperty({ example: 'Neem Oil 500ml' })
  @IsString()
  @MinLength(1)
  product_name: string;

  @ApiPropertyOptional({ example: 'NEEM-500' })
  @IsOptional()
  @IsString()
  product_sku?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  available_qty?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  requested_qty?: number;

  @ApiPropertyOptional({ default: 'Product' })
  @IsOptional()
  @IsString()
  product_type?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  selling_price?: number;
}

export class CreateRefundDto {
  @ApiProperty({ example: 'KO-ORD-12345' })
  @IsString()
  @MinLength(1)
  order_id: string;

  @ApiPropertyOptional({ example: 'TKT-001' })
  @IsOptional()
  @IsString()
  ticket_id?: string;

  @ApiPropertyOptional({ example: 'Manish Pandey' })
  @IsOptional()
  @IsString()
  customer_name?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  customer_phone?: string;

  @ApiPropertyOptional({ example: 'manish@example.com' })
  @IsOptional()
  @IsString()
  customer_email?: string;

  @ApiPropertyOptional({ example: '400001' })
  @IsOptional()
  @IsString()
  customer_pin?: string;

  @ApiPropertyOptional({ default: 'New Buyer' })
  @IsOptional()
  @IsString()
  customer_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  order_date?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cod_amount?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  prepaid_amount?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total_amount?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ example: 'COD' })
  @IsOptional()
  @IsString()
  payment_mode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  utr_number?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discount_value?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discount_percent?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  coins_used?: number;

  @ApiPropertyOptional({ example: 'Neem Oil 500ml' })
  @IsOptional()
  @IsString()
  product_name?: string;

  @ApiPropertyOptional({ example: 'NEEM-500' })
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

  @ApiPropertyOptional({ enum: REQUEST_TYPES, default: 'refund' })
  @IsOptional()
  @IsIn(REQUEST_TYPES)
  request_type?: string;

  @ApiPropertyOptional({ enum: ISSUE_TYPES, default: 'others' })
  @IsOptional()
  @IsIn(ISSUE_TYPES)
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

  @ApiPropertyOptional({ enum: UNBOXING_VIDEO_SOURCES, default: 'google_drive' })
  @IsOptional()
  @IsIn(UNBOXING_VIDEO_SOURCES)
  unboxing_video_source?: string;

  @ApiPropertyOptional({ enum: DEPARTMENTS, default: 'Support' })
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

  @ApiPropertyOptional({ default: 48 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sla_hours?: number;

  @ApiPropertyOptional({ type: [CreateRefundProductDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRefundProductDto)
  products?: CreateRefundProductDto[];
}
