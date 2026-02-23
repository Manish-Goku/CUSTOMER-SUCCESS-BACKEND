import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

const STATUSES = ['new', 'contacted', 'follow_up', 'qualified', 'converted', 'closed', 'not_interested'] as const;
const PRIORITIES = ['high', 'medium', 'low'] as const;

export class GetYoutubeLeadsDto {
  @ApiPropertyOptional({ enum: STATUSES }) @IsOptional() @IsIn([...STATUSES]) status?: string;
  @ApiPropertyOptional({ enum: PRIORITIES }) @IsOptional() @IsIn([...PRIORITIES]) priority?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() assigned_to?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @Transform(({ value }) => value === 'true') is_qualified_lead?: boolean;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ default: 50 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}
