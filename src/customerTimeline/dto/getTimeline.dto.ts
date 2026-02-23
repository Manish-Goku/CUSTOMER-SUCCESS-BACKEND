import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

const EVENT_TYPES = [
  'call',
  'chat',
  'email',
  'ticket',
  'order',
  'feedback',
  'note',
] as const;

export class GetTimelineDto {
  @ApiPropertyOptional({ enum: EVENT_TYPES, description: 'Filter by event type' })
  @IsOptional()
  @IsString()
  @IsIn(EVENT_TYPES)
  event_type?: string;

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
  @Max(200)
  limit?: number;
}

export class TimelineEventResponseDto {
  id: string;
  mobile_number: string;
  event_type: string;
  event_id: string | null;
  title: string;
  description: string | null;
  metadata: Record<string, unknown>;
  agent_id: string | null;
  created_at: string;
}

export interface TimelineSummary {
  event_type: string;
  count: number;
}
