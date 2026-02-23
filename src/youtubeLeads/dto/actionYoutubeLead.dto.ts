import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsArray, IsUUID, MinLength } from 'class-validator';

const ACTIONS = ['call', 'follow_up', 'qualify', 'convert', 'close', 'not_interested'] as const;

export class ActionYoutubeLeadDto {
  @ApiProperty({ enum: ACTIONS }) @IsIn([...ACTIONS]) action: string;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() performed_by?: string;
}

export class BulkAssignDto {
  @ApiProperty({ type: [String] }) @IsArray() @IsUUID('4', { each: true }) lead_ids: string[];
  @ApiProperty() @IsString() @MinLength(1) assigned_to: string;
}
