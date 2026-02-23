import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateSupportEmailDto {
  @ApiPropertyOptional({ example: 'KO Support Updated' })
  @IsOptional()
  @IsString()
  display_name?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Toggle monitoring on/off',
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    example: 'abcd efgh ijkl mnop',
    description: 'New Gmail App Password',
  })
  @IsOptional()
  @IsString()
  imap_password?: string;
}
