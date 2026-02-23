import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OutboundCallDto {
  @ApiProperty({ example: '9876543210', description: 'Customer phone number' })
  @IsString()
  @IsNotEmpty()
  customer_number: string;

  @ApiPropertyOptional({ description: 'IVR flow / sound file / message target' })
  @IsOptional()
  @IsString()
  target?: string;

  @ApiPropertyOptional({ description: 'Override bridge DID (defaults to env)' })
  @IsOptional()
  @IsString()
  bridge?: string;
}
