import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddSupportEmailDto {
  @ApiProperty({
    example: 'support@katyayaniorganics.com',
    description: 'Gmail/Workspace email address to monitor',
  })
  @IsEmail()
  @IsNotEmpty()
  email_address: string;

  @ApiPropertyOptional({
    example: 'KO Support',
    description: 'Display name for this mailbox',
  })
  @IsOptional()
  @IsString()
  display_name?: string;
}
