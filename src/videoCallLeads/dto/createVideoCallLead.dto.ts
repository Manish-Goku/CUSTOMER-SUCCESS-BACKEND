import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsDateString,
  MinLength,
} from 'class-validator';

export class CreateVideoCallLeadDto {
  @ApiProperty({ example: 'VCL-001' })
  @IsString()
  @MinLength(1)
  lead_id: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @MinLength(1)
  mobile_number: string;

  @ApiPropertyOptional({ example: 'Ramesh Kumar' })
  @IsOptional()
  @IsString()
  customer_name?: string;

  @ApiPropertyOptional({ example: 'Madhya Pradesh' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ default: 'Live Video Calls' })
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
