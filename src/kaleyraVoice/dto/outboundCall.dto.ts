import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OutboundCallDto {
  @ApiProperty({ example: '9876543210', description: 'Customer phone number (10-digit)' })
  @IsString()
  @IsNotEmpty()
  customer_number: string;

  @ApiProperty({ example: '123.sound', description: 'Sound file ID or IVR reference (e.g. ivr:1234)' })
  @IsString()
  @IsNotEmpty()
  play: string;

  @ApiPropertyOptional({ description: 'Campaign name for grouping' })
  @IsOptional()
  @IsString()
  campaign?: string;
}
