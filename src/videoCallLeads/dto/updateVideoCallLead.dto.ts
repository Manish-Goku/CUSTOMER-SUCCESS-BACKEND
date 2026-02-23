import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsDateString,
} from 'class-validator';

export class UpdateVideoCallLeadDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customer_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  call_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  call_status?: string;

  @ApiPropertyOptional({ description: 'Call date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  call_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agent_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  agent_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  order_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  order_amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  crop_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  crop_issue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  crop_stage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  crop_area?: string;

  @ApiPropertyOptional({ description: 'Follow-up date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  follow_up_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coupon_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  farmer_remarks?: string;

  @ApiPropertyOptional({ description: 'Attempt date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  attempt_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  attempt_status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  attempt_agent_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  attempt_remark?: string;
}
