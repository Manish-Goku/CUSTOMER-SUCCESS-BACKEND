import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsInt, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

const CATEGORIES = ['packaging', 'delivery', 'product', 'service', 'other'] as const;
const PRIORITIES = ['critical', 'high', 'medium', 'low'] as const;
const STATUSES = ['new', 'assigned', 'in_progress', 'resolved', 'closed'] as const;

export class CreateCustomerFeedbackDto {
  @ApiProperty() @IsString() @MinLength(1) problem: string;
  @ApiPropertyOptional() @IsOptional() @IsString() order_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() solution?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() advice_for_future?: string;
  @ApiPropertyOptional({ enum: CATEGORIES }) @IsOptional() @IsIn([...CATEGORIES]) category?: string;
  @ApiPropertyOptional({ enum: PRIORITIES }) @IsOptional() @IsIn([...PRIORITIES]) priority?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() created_by?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() created_by_name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() team_lead?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() team_lead_name?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) impact_count?: number;
}

export class UpdateCustomerFeedbackDto {
  @ApiPropertyOptional() @IsOptional() @IsString() problem?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() order_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() solution?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() advice_for_future?: string;
  @ApiPropertyOptional({ enum: CATEGORIES }) @IsOptional() @IsIn([...CATEGORIES]) category?: string;
  @ApiPropertyOptional({ enum: PRIORITIES }) @IsOptional() @IsIn([...PRIORITIES]) priority?: string;
  @ApiPropertyOptional({ enum: STATUSES }) @IsOptional() @IsIn([...STATUSES]) status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() team_lead?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() team_lead_name?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) impact_count?: number;
}
