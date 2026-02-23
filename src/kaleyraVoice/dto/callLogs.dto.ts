import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CallLogsQueryDto {
  @ApiPropertyOptional({ description: 'Start time (ISO 8601)' })
  @IsOptional()
  @IsString()
  start_time?: string;

  @ApiPropertyOptional({ description: 'End time (ISO 8601)' })
  @IsOptional()
  @IsString()
  end_time?: string;

  @ApiPropertyOptional({ description: 'Filter by call status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Results per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
