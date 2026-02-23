import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConversationResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: '919876543210' })
  phone_number: string;

  @ApiPropertyOptional({ example: 'Rahul Sharma' })
  customer_name: string | null;

  @ApiProperty({ example: 'open', enum: ['open', 'resolved', 'archived'] })
  status: string;

  @ApiPropertyOptional({ example: 'support' })
  assigned_team: string | null;

  @ApiPropertyOptional({ example: 'agent_abc123' })
  assigned_agent: string | null;

  @ApiProperty({ example: '2026-02-23T10:00:00.000Z' })
  last_message_at: string;

  @ApiProperty({ example: 3 })
  unread_count: number;

  @ApiProperty({ example: '2026-02-23T10:00:00.000Z' })
  created_at: string;

  @ApiProperty({ example: '2026-02-23T10:00:00.000Z' })
  updated_at: string;
}
