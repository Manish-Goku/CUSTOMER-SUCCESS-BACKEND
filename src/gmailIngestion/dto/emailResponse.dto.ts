import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttachmentMeta } from '../../common/interfaces/gmailTypes.js';

export class EmailResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  support_email_id: string;

  @ApiProperty({ example: '<CABx1234@mail.gmail.com>' })
  message_id: string;

  @ApiPropertyOptional({ example: '<CABx0000@mail.gmail.com>' })
  thread_id: string | null;

  @ApiProperty({ example: 'customer@gmail.com' })
  from_address: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  from_name: string | null;

  @ApiProperty({ example: ['support@katyayaniorganics.com'], type: [String] })
  to_addresses: string[];

  @ApiProperty({ example: [], type: [String] })
  cc_addresses: string[];

  @ApiPropertyOptional({ example: 'Order inquiry' })
  subject: string | null;

  @ApiPropertyOptional({ example: 'Hi, I have a question about my order...' })
  body_text: string | null;

  @ApiPropertyOptional()
  body_html: string | null;

  @ApiPropertyOptional({ example: 'Hi, I have a question about...' })
  snippet: string | null;

  @ApiProperty({ example: false })
  has_attachments: boolean;

  @ApiProperty({ example: [] })
  attachments: AttachmentMeta[];

  @ApiPropertyOptional({ example: '2026-02-22T10:00:00.000Z' })
  internal_date: string | null;

  @ApiProperty({ example: '2026-02-22T10:00:00.000Z' })
  received_at: string;

  @ApiProperty({ example: false })
  is_read: boolean;

  @ApiPropertyOptional({
    example: 'Customer asking about order delivery status for order #12345',
  })
  summary: string | null;

  @ApiPropertyOptional({
    example: 'dispatch',
    enum: [
      'finance',
      'support',
      'dispatch',
      'sales',
      'technical',
      'returns_refunds',
      'general',
    ],
  })
  suggested_team: string | null;

  @ApiProperty({ example: 'inbound', enum: ['inbound', 'outbound'] })
  direction: string;

  @ApiPropertyOptional({ example: 'Manish' })
  agent_name: string | null;

  @ApiPropertyOptional({ example: '<CABx1234@mail.gmail.com>' })
  in_reply_to: string | null;

  @ApiProperty({ example: '2026-02-22T10:00:00.000Z' })
  created_at: string;
}
