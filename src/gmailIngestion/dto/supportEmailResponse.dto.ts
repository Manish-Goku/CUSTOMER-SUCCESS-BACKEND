import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SupportEmailResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'support@katyayaniorganics.com' })
  email_address: string;

  @ApiPropertyOptional({ example: 'KO Support' })
  display_name: string | null;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiPropertyOptional({ example: 'support' })
  department: string | null;

  @ApiPropertyOptional({ example: '2026-02-22T10:30:00.000Z' })
  last_synced_at: string | null;

  @ApiProperty({ example: '2026-02-22T10:00:00.000Z' })
  created_at: string;

  @ApiProperty({ example: '2026-02-22T10:00:00.000Z' })
  updated_at: string;
}
