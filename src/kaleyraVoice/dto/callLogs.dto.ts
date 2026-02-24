import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CallLogsQueryDto {
  @ApiPropertyOptional({ description: 'From date (YYYY/MM/DD or DD/MM/YYYY)' })
  @IsOptional()
  @IsString()
  from_date?: string;

  @ApiPropertyOptional({ description: 'To date (YYYY/MM/DD or DD/MM/YYYY)' })
  @IsOptional()
  @IsString()
  to_date?: string;

  @ApiPropertyOptional({ description: 'Filter by phone number (10-digit)' })
  @IsOptional()
  @IsString()
  call_to?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Results per page', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;
}
