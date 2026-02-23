import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsIn,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsObject,
} from 'class-validator';

const AUDIT_STATUSES = [
  'pending',
  'in_progress',
  'completed',
  'flagged',
] as const;

export class UpdateAuditDto {
  @ApiPropertyOptional({ description: 'Audit score (0-100)', minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  audit_score?: number;

  @ApiPropertyOptional({ description: 'Audit notes' })
  @IsOptional()
  @IsString()
  audit_notes?: string;

  @ApiPropertyOptional({ enum: AUDIT_STATUSES })
  @IsOptional()
  @IsIn(AUDIT_STATUSES)
  status?: string;

  @ApiPropertyOptional({ description: 'UUID or name of auditor' })
  @IsOptional()
  @IsString()
  audited_by?: string;

  @ApiPropertyOptional({ description: 'Mark as unusual' })
  @IsOptional()
  @IsBoolean()
  is_unusual?: boolean;

  @ApiPropertyOptional({ description: 'Reason for marking unusual' })
  @IsOptional()
  @IsString()
  unusual_reason?: string;

  @ApiPropertyOptional({ description: 'Category of the interaction' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Structured audit responses' })
  @IsOptional()
  @IsObject()
  audit_responses?: Record<string, unknown>;
}
