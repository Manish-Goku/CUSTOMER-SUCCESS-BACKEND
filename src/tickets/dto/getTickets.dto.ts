import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

const PRIORITIES = ['critical', 'high', 'medium', 'low'] as const;
const STATUSES = ['open', 'in_progress', 'pending_customer', 'escalated', 'resolved', 'closed'] as const;

export class GetTicketsDto {
  @ApiPropertyOptional({ enum: STATUSES }) @IsOptional() @IsIn([...STATUSES]) status?: string;
  @ApiPropertyOptional({ enum: PRIORITIES }) @IsOptional() @IsIn([...PRIORITIES]) priority?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() channel?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() assigned_to?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ default: 50 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}
