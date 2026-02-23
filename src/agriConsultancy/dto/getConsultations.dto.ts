import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsInt, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

const STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'] as const;

export class GetConsultationsDto {
  @ApiPropertyOptional({ enum: STATUSES }) @IsOptional() @IsIn([...STATUSES]) status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() agronomist?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() crop_type?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() date_from?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() date_to?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ default: 50 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}
