import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendReplyDto {
  @ApiProperty({ example: 'Thank you for contacting us...' })
  @IsString()
  @IsNotEmpty()
  body_text: string;

  @ApiPropertyOptional({ example: '<p>Thank you for contacting us...</p>' })
  @IsString()
  @IsOptional()
  body_html?: string;

  @ApiPropertyOptional({ example: 'Manish' })
  @IsString()
  @IsOptional()
  agent_name?: string;

  @ApiPropertyOptional({ example: ['manager@katyayani.com'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  cc?: string[];

  @ApiPropertyOptional({ example: ['audit@katyayani.com'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  bcc?: string[];
}
