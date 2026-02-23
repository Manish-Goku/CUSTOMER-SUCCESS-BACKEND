import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsIn,
  IsUUID,
  IsObject,
  MinLength,
  Matches,
} from 'class-validator';

const EVENT_TYPES = [
  'call',
  'chat',
  'email',
  'ticket',
  'order',
  'feedback',
  'note',
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export class CreateTimelineEventDto {
  @ApiProperty({ example: '9876543210', description: 'Customer mobile number' })
  @IsString()
  @MinLength(1)
  @Matches(/^\d{10,15}$/, {
    message: 'mobile_number must be 10-15 digits',
  })
  mobile_number: string;

  @ApiProperty({ enum: EVENT_TYPES, example: 'call' })
  @IsString()
  @IsIn(EVENT_TYPES)
  event_type: EventType;

  @ApiPropertyOptional({ example: 'ivr-call-uuid-123' })
  @IsOptional()
  @IsString()
  event_id?: string;

  @ApiProperty({ example: 'Inbound call from customer' })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiPropertyOptional({ example: 'Customer asked about order #12345 status' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: { order_id: '12345', duration: 120 } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Agent UUID from agents table' })
  @IsOptional()
  @IsUUID()
  agent_id?: string;
}
