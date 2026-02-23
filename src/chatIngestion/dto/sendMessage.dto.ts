import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    example: 'Hello, your order has been shipped!',
    description: 'Message text to send via WhatsApp',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    example: 'agent_abc123',
    description: 'Agent ID sending the message',
  })
  @IsOptional()
  @IsString()
  agent_id?: string;

  @ApiPropertyOptional({
    example: 'Manish',
    description: 'Agent display name',
  })
  @IsOptional()
  @IsString()
  agent_name?: string;
}
