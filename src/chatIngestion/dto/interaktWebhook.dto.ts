import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InteraktWebhookDataCustomerDto {
  @ApiPropertyOptional({ example: '919876543210' })
  @IsOptional()
  @IsString()
  country_code?: string;

  @ApiPropertyOptional({ example: '919876543210' })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiPropertyOptional({ example: 'Rahul Sharma' })
  @IsOptional()
  @IsString()
  name?: string;
}

export class InteraktWebhookDataMessageDto {
  @ApiPropertyOptional({ example: 'msg_abc123' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ example: 'text' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 'Hi, I need help with my order' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ example: 'https://media.example.com/image.jpg' })
  @IsOptional()
  @IsString()
  media_url?: string;
}

export class InteraktWebhookDataDto {
  @ApiPropertyOptional({ type: InteraktWebhookDataCustomerDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => InteraktWebhookDataCustomerDto)
  customer?: InteraktWebhookDataCustomerDto;

  @ApiPropertyOptional({ type: InteraktWebhookDataMessageDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => InteraktWebhookDataMessageDto)
  message?: InteraktWebhookDataMessageDto;
}

export class InteraktWebhookDto {
  @ApiProperty({ example: 'message_received' })
  @IsString()
  type: string;

  @ApiPropertyOptional({ type: InteraktWebhookDataDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => InteraktWebhookDataDto)
  data?: InteraktWebhookDataDto;
}
