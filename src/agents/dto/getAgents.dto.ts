import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsIn,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

const AGENT_STATUSES = [
  'available',
  'on_call',
  'wrap_up',
  'break',
  'offline',
] as const;

export class GetAgentsDto {
  @ApiPropertyOptional({ description: 'Filter by department' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ enum: AGENT_STATUSES, description: 'Filter by status' })
  @IsOptional()
  @IsIn(AGENT_STATUSES)
  status?: string;

  @ApiPropertyOptional({ enum: ['super_admin', 'admin', 'agent'], description: 'Filter by role' })
  @IsOptional()
  @IsIn(['super_admin', 'admin', 'agent'])
  role?: string;

  @ApiPropertyOptional({ description: 'Filter by admin_id (get agents under a specific admin)' })
  @IsOptional()
  @IsString()
  admin_id?: string;

  @ApiPropertyOptional({ description: 'Filter by is_active' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Search by name, email, or phone' })
  @IsOptional()
  @IsString()
  search?: string;

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
