import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

const ACTION_TYPES = [
  'comment',
  'approve',
  'partial_approve',
  'reject',
  'escalate',
  'assign',
  'close',
  'reopen',
] as const;

export class AddRefundActionDto {
  @ApiProperty({ example: 'Manish Pandey' })
  @IsString()
  @MinLength(1)
  action_by: string;

  @ApiPropertyOptional({ example: 'agent' })
  @IsOptional()
  @IsString()
  action_by_role?: string;

  @ApiPropertyOptional({ example: 'manish@ko.com' })
  @IsOptional()
  @IsString()
  action_by_email?: string;

  @ApiProperty({ enum: ACTION_TYPES, example: 'approve' })
  @IsIn(ACTION_TYPES)
  action_type: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  action_amount?: number;

  @ApiPropertyOptional({ example: 'Approved after QC review' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  attachment_url?: string;
}
