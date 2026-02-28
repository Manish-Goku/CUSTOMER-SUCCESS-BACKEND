import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddSupportEmailDto {
  @ApiProperty({
    example: 'support@katyayaniorganics.com',
    description: 'Google Workspace email address to monitor',
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

  @ApiPropertyOptional({
    example: 'support',
    description: 'Default department for emails from this mailbox (overrides AI classification)',
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({
    example: 'abcd efgh ijkl mnop',
    description: 'Gmail App Password (generate from Google Account → Security → App Passwords)',
  })
  @IsString()
  @IsNotEmpty()
  imap_password: string;
}
