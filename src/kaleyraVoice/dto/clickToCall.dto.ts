import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClickToCallDto {
  @ApiProperty({ example: '9876543210', description: 'Customer phone number' })
  @IsString()
  @IsNotEmpty()
  customer_number: string;

  @ApiProperty({ example: '9123456789', description: 'Agent mobile number to ring first' })
  @IsString()
  @IsNotEmpty()
  agent_number: string;

  @ApiPropertyOptional({ example: 'Manish', description: 'Agent name for display in ivr_calls' })
  @IsOptional()
  @IsString()
  agent_name?: string;
}
