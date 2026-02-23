import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsIn,
  IsBoolean,
  IsInt,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

const INTERACTION_TYPES = ['call', 'chat', 'email'] as const;
const AUDIT_STATUSES = [
  'pending',
  'in_progress',
  'completed',
  'flagged',
] as const;

export class GetAuditsDto {
  @ApiPropertyOptional({ enum: INTERACTION_TYPES })
  @IsOptional()
  @IsIn(INTERACTION_TYPES)
  interaction_type?: string;

  @ApiPropertyOptional({ enum: AUDIT_STATUSES })
  @IsOptional()
  @IsIn(AUDIT_STATUSES)
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by agent UUID' })
  @IsOptional()
  @IsUUID()
  agent_id?: string;

  @ApiPropertyOptional({ description: 'Filter unusual audits' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_unusual?: boolean;

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
