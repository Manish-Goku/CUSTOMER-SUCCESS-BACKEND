import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GetVideoCallLeadsDto {
  @ApiPropertyOptional({ description: 'Filter by call status' })
  @IsOptional()
  @IsString()
  call_status?: string;

  @ApiPropertyOptional({ description: 'Filter by agent UUID' })
  @IsOptional()
  @IsUUID()
  agent_id?: string;

  @ApiPropertyOptional({ description: 'Search by customer name or mobile number' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by call date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  call_date?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
