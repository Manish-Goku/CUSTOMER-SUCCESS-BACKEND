import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsIn,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

const TIERS = ['vip', 'high', 'normal', 'low'] as const;
type CustomerTier = (typeof TIERS)[number];

export class UpdateSlaConfigDto {
  @ApiProperty({ description: 'Max minutes to first response', example: 15 })
  @IsInt()
  @Min(1)
  response_time_minutes: number;

  @ApiProperty({ description: 'Max minutes to resolution', example: 120 })
  @IsInt()
  @Min(1)
  resolution_time_minutes: number;

  @ApiProperty({ description: 'Minutes before escalation', example: 30 })
  @IsInt()
  @Min(1)
  escalation_time_minutes: number;
}

export class BulkUpdateSlaConfigItemDto {
  @ApiProperty({ enum: TIERS, example: 'vip' })
  @IsString()
  @IsIn(TIERS)
  tier: CustomerTier;

  @ApiProperty({ description: 'Max minutes to first response', example: 15 })
  @IsInt()
  @Min(1)
  response_time_minutes: number;

  @ApiProperty({ description: 'Max minutes to resolution', example: 120 })
  @IsInt()
  @Min(1)
  resolution_time_minutes: number;

  @ApiProperty({ description: 'Minutes before escalation', example: 30 })
  @IsInt()
  @Min(1)
  escalation_time_minutes: number;
}

export class BulkUpdateSlaConfigDto {
  @ApiProperty({ type: [BulkUpdateSlaConfigItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkUpdateSlaConfigItemDto)
  items: BulkUpdateSlaConfigItemDto[];
}

export class SlaConfigResponseDto {
  @ApiProperty() id: string;
  @ApiProperty({ enum: TIERS }) tier: CustomerTier;
  @ApiProperty() response_time_minutes: number;
  @ApiProperty() resolution_time_minutes: number;
  @ApiProperty() escalation_time_minutes: number;
  @ApiPropertyOptional() is_active: boolean | null;
  @ApiProperty() created_at: string;
  @ApiProperty() updated_at: string;
}
