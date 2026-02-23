import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class NetcoreTextTypeDto {
  @ApiProperty({ example: 'Hello, I need help' })
  @IsString()
  text: string;
}

export class NetcoreImageTypeDto {
  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  caption?: string;
}

export class NetcoreDocumentTypeDto {
  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  filename?: string;

  @IsOptional()
  @IsString()
  caption?: string;
}

export class NetcoreIncomingMessageDto {
  @ApiProperty({ example: '919201053157' })
  @IsString()
  from: string;

  @ApiPropertyOptional({ example: 'Ramesh Kumar' })
  @IsOptional()
  @IsString()
  from_name?: string;

  @ApiProperty({ example: 'wamid.HBgLOTE5MjAxMDUzMTU3FQIAEhgg' })
  @IsString()
  message_id: string;

  @ApiProperty({ example: 'text' })
  @IsString()
  message_type: string;

  @ApiPropertyOptional({ example: '1724226706' })
  @IsOptional()
  @IsString()
  received_at?: string;

  @ApiPropertyOptional({ type: NetcoreTextTypeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NetcoreTextTypeDto)
  text_type?: NetcoreTextTypeDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => NetcoreImageTypeDto)
  image_type?: NetcoreImageTypeDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => NetcoreDocumentTypeDto)
  document_type?: NetcoreDocumentTypeDto;

  @ApiPropertyOptional({ example: '912249757556' })
  @IsOptional()
  @IsString()
  to?: string;
}

export class NetcoreWebhookDto {
  @ApiProperty({ type: [NetcoreIncomingMessageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NetcoreIncomingMessageDto)
  incoming_message: NetcoreIncomingMessageDto[];
}
