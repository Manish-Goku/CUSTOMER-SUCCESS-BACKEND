import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatMessageResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  conversation_id: string;

  @ApiPropertyOptional({ example: 'msg_abc123' })
  interakt_message_id: string | null;

  @ApiProperty({ example: 'inbound', enum: ['inbound', 'outbound'] })
  direction: string;

  @ApiProperty({
    example: 'text',
    enum: ['text', 'image', 'document', 'audio', 'video'],
  })
  message_type: string;

  @ApiPropertyOptional({ example: 'Hi, I need help with my order' })
  content: string | null;

  @ApiPropertyOptional({ example: 'https://media.example.com/image.jpg' })
  media_url: string | null;

  @ApiProperty({ example: 'customer', enum: ['customer', 'agent'] })
  sender_type: string;

  @ApiPropertyOptional({ example: 'Rahul Sharma' })
  sender_name: string | null;

  @ApiPropertyOptional({ example: 'agent_abc123' })
  agent_id: string | null;

  @ApiPropertyOptional({ example: 'Customer asking about order delivery' })
  summary: string | null;

  @ApiPropertyOptional({ example: 'dispatch' })
  suggested_team: string | null;

  @ApiProperty({ example: false })
  is_read: boolean;

  @ApiProperty({ example: '2026-02-23T10:00:00.000Z' })
  created_at: string;
}
