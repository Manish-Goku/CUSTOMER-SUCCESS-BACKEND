import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsUUID, IsInt, Min, Max, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

const FEEDBACK_TYPES = ['call', 'chat', 'ticket', 'survey', 'escalation'] as const;
const SENTIMENTS = ['positive', 'neutral', 'negative'] as const;
const STATUSES = ['pending', 'reviewed', 'actioned'] as const;

export class CreateAgentFeedbackDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() agent_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() agent_name?: string;
  @ApiPropertyOptional({ enum: FEEDBACK_TYPES }) @IsOptional() @IsIn([...FEEDBACK_TYPES]) feedback_type?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) rating?: number;
  @ApiPropertyOptional({ enum: SENTIMENTS }) @IsOptional() @IsIn([...SENTIMENTS]) sentiment?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reference_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reference_type?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customer_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customer_name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subcategory?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() comment?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() action_taken?: string;
}

export class UpdateAgentFeedbackDto {
  @ApiPropertyOptional({ enum: STATUSES }) @IsOptional() @IsIn([...STATUSES]) status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() action_taken?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reviewed_by?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() comment?: string;
}
