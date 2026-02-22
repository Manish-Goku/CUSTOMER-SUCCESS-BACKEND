import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PubSubMessageDto {
  @ApiProperty({ description: 'Base64 encoded JSON: { emailAddress, historyId }' })
  @IsString()
  data: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  messageId?: string;
}

export class GmailPushNotificationDto {
  @ApiProperty({ type: PubSubMessageDto })
  @ValidateNested()
  @Type(() => PubSubMessageDto)
  message: PubSubMessageDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subscription?: string;
}
