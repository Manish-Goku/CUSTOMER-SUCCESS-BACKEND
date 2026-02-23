import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsObject,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

// --- Structure 1: message_received ---

export class InteraktCustomerTraitsDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  whatsapp_opted_in?: boolean;

  @IsOptional()
  @IsString()
  source_id?: string | null;

  @IsOptional()
  @IsString()
  source_url?: string | null;

  @IsOptional()
  @IsString()
  state?: string;

  [key: string]: unknown;
}

export class InteraktMessageContextDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  id?: string;
}

export class InteraktWebhookCustomerDto {
  @ApiPropertyOptional({ example: '2ad549f4-b04b-44fa-8166-7754966a7a79' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ example: '918219953132' })
  @IsOptional()
  @IsString()
  channel_phone_number?: string;

  @ApiPropertyOptional({ example: '9201053157' })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiPropertyOptional({ example: '+91' })
  @IsOptional()
  @IsString()
  country_code?: string;

  @ApiPropertyOptional({ type: InteraktCustomerTraitsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => InteraktCustomerTraitsDto)
  traits?: InteraktCustomerTraitsDto;
}

export class InteraktWebhookMessageDto {
  @ApiPropertyOptional({ example: 'e9ef64aa-6e3a-4f12-b82e-5d140f3931a0' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ example: 'CustomerMessage' })
  @IsOptional()
  @IsString()
  chat_message_type?: string;

  @ApiPropertyOptional({ example: 'Text' })
  @IsOptional()
  @IsString()
  message_content_type?: string;

  @ApiPropertyOptional({ example: 'Hi, I need help with my order' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ example: 'https://media.example.com/image.jpg' })
  @IsOptional()
  @IsString()
  media_url?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  received_at_utc?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => InteraktMessageContextDto)
  message_context?: InteraktMessageContextDto;

  @IsOptional()
  @IsString()
  message_status?: string;

  @IsOptional()
  @IsBoolean()
  is_template_message?: boolean;

  [key: string]: unknown;
}

export class InteraktMessageReceivedDataDto {
  @ApiPropertyOptional({ type: InteraktWebhookCustomerDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => InteraktWebhookCustomerDto)
  customer?: InteraktWebhookCustomerDto;

  @ApiPropertyOptional({ type: InteraktWebhookMessageDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => InteraktWebhookMessageDto)
  message?: InteraktWebhookMessageDto;
}

// --- Structure 2: workflow_response_update ---

export class WorkflowAnswerDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  message?: string | null;

  @IsOptional()
  @IsString()
  media_url?: string | null;

  @IsOptional()
  @IsString()
  media_file_name?: string | null;

  @IsOptional()
  @IsString()
  media_id?: string | null;

  @IsOptional()
  @IsString()
  message_content_type?: string;

  @IsOptional()
  @IsString()
  received_at_utc?: string;

  [key: string]: unknown;
}

export class WorkflowQuestionDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  message_type?: string;

  @IsOptional()
  @IsString()
  user_trait_name?: string;

  [key: string]: unknown;
}

export class WorkflowStepDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkflowQuestionDto)
  question?: WorkflowQuestionDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => WorkflowAnswerDto)
  answer?: WorkflowAnswerDto;
}

export class InteraktWorkflowDataDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  customer_id?: string;

  @IsOptional()
  @IsString()
  customer_name?: string;

  @IsOptional()
  @IsString()
  customer_number?: string;

  @IsOptional()
  @IsString()
  workflow_id?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  data?: WorkflowStepDto[];

  @IsOptional()
  @IsString()
  triggered_from?: string;

  [key: string]: unknown;
}

// --- Top-level webhook DTO (accepts both structures) ---

export class InteraktWebhookDto {
  @ApiProperty({ example: 'message_received' })
  @IsString()
  type: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @ApiPropertyOptional({ example: '1.0' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timestamp?: string;
}
