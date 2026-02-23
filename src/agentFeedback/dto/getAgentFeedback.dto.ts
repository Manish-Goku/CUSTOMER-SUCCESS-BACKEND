import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

const FEEDBACK_TYPES = ['call', 'chat', 'ticket', 'survey', 'escalation'] as const;
const SENTIMENTS = ['positive', 'neutral', 'negative'] as const;
const STATUSES = ['pending', 'reviewed', 'actioned'] as const;

export class GetAgentFeedbackDto {
  @ApiPropertyOptional() @IsOptional() @IsString() agent_id?: string;
  @ApiPropertyOptional({ enum: FEEDBACK_TYPES }) @IsOptional() @IsIn([...FEEDBACK_TYPES]) feedback_type?: string;
  @ApiPropertyOptional({ enum: SENTIMENTS }) @IsOptional() @IsIn([...SENTIMENTS]) sentiment?: string;
  @ApiPropertyOptional({ enum: STATUSES }) @IsOptional() @IsIn([...STATUSES]) status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @ApiPropertyOptional({ default: 50 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}
