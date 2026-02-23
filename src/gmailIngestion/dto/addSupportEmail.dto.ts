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

  @ApiProperty({
    example: 'abcd efgh ijkl mnop',
    description: 'Gmail App Password (generate from Google Account → Security → App Passwords)',
  })
  @IsString()
  @IsNotEmpty()
  imap_password: string;
}
