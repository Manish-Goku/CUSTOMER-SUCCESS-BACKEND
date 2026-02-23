import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsIn,
  IsInt,
  IsArray,
  Min,
  Max,
  MinLength,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

const TYPES = ['hangup', 'chat'] as const;
const STATUSES = ['pending', 'assigned', 'in_progress', 'completed'] as const;
const PRIORITIES = ['high', 'normal', 'low'] as const;

export class CreateQueryAssignmentDto {
  @ApiProperty({ enum: TYPES })
  @IsIn(TYPES)
  type: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @MinLength(1)
  customer_phone: string;

  @ApiPropertyOptional({ example: 'Ramesh Kumar' })
  @IsOptional()
  @IsString()
  customer_name?: string;

  @ApiPropertyOptional({ example: 'WhatsApp' })
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiPropertyOptional({ example: 'Uttar Pradesh' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ enum: PRIORITIES, default: 'normal' })
  @IsOptional()
  @IsIn(PRIORITIES)
  priority?: string;
}

export class UpdateQueryAssignmentDto {
  @ApiPropertyOptional({ enum: STATUSES })
  @IsOptional()
  @IsIn(STATUSES)
  status?: string;

  @ApiPropertyOptional({ enum: PRIORITIES })
  @IsOptional()
  @IsIn(PRIORITIES)
  priority?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assigned_to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assigned_to_name?: string;
}

export class GetQueryAssignmentsDto {
  @ApiPropertyOptional({ enum: TYPES })
  @IsOptional()
  @IsIn(TYPES)
  type?: string;

  @ApiPropertyOptional({ enum: STATUSES })
  @IsOptional()
  @IsIn(STATUSES)
  status?: string;

  @ApiPropertyOptional()
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

export class BulkAssignDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  ids: string[];

  @ApiProperty()
  @IsString()
  @MinLength(1)
  assigned_to: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  assigned_to_name: string;
}

export class QueryAssignmentResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() type: string;
  @ApiProperty() customer_phone: string;
  @ApiProperty() customer_name: string | null;
  @ApiProperty() channel: string | null;
  @ApiProperty() state: string | null;
  @ApiProperty() received_at: string;
  @ApiProperty() status: string;
  @ApiProperty() priority: string;
  @ApiProperty() assigned_to: string | null;
  @ApiProperty() assigned_to_name: string | null;
  @ApiProperty() completed_at: string | null;
  @ApiProperty() created_at: string;
  @ApiProperty() updated_at: string;
}
