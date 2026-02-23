import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsIn,
  IsBoolean,
  IsInt,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

const CATEGORIES = ['orders', 'product', 'support', 'sales', 'general'] as const;
const CHANNELS = ['all', 'general', 'retailer', 'app', 'website'] as const;

export class CreateChatTemplateDto {
  @ApiProperty({ example: '/order' })
  @IsString()
  @MinLength(1)
  trigger: string;

  @ApiProperty({ example: 'Order Status' })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({ example: 'I will check your order status. Please share your order ID.' })
  @IsString()
  @MinLength(1)
  content: string;

  @ApiPropertyOptional({ enum: CATEGORIES, default: 'general' })
  @IsOptional()
  @IsIn(CATEGORIES)
  category?: string;

  @ApiPropertyOptional({ enum: CHANNELS, default: 'all' })
  @IsOptional()
  @IsIn(CHANNELS)
  channel?: string;
}

export class UpdateChatTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  trigger?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @ApiPropertyOptional({ enum: CATEGORIES })
  @IsOptional()
  @IsIn(CATEGORIES)
  category?: string;

  @ApiPropertyOptional({ enum: CHANNELS })
  @IsOptional()
  @IsIn(CHANNELS)
  channel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class GetChatTemplatesDto {
  @ApiPropertyOptional({ enum: CATEGORIES })
  @IsOptional()
  @IsIn(CATEGORIES)
  category?: string;

  @ApiPropertyOptional({ enum: CHANNELS })
  @IsOptional()
  @IsIn(CHANNELS)
  channel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class ChatTemplateResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() trigger: string;
  @ApiProperty() title: string;
  @ApiProperty() content: string;
  @ApiProperty() category: string;
  @ApiProperty() channel: string;
  @ApiProperty() is_active: boolean;
  @ApiProperty() usage_count: number;
  @ApiProperty() created_at: string;
  @ApiProperty() updated_at: string;
}
