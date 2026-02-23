import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCallCategoryDto {
  @ApiProperty({ example: 'Sales' })
  @IsString()
  @MinLength(1)
  department: string;

  @ApiProperty({ example: 'Product Inquiry' })
  @IsString()
  @MinLength(1)
  category: string;

  @ApiPropertyOptional({ example: 'Pricing' })
  @IsOptional()
  @IsString()
  sub_category?: string;

  @ApiPropertyOptional({ example: 24, default: 24 })
  @IsOptional()
  @IsInt()
  @Min(1)
  sla_hours?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  requires_attachment?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  requires_description?: boolean;

  @ApiPropertyOptional({ description: 'UUID of parent category for nesting' })
  @IsOptional()
  @IsUUID()
  parent_category_id?: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  display_order?: number;
}

export class UpdateCallCategoryDto {
  @ApiPropertyOptional({ example: 'Sales' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  department?: string;

  @ApiPropertyOptional({ example: 'Product Inquiry' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  category?: string;

  @ApiPropertyOptional({ example: 'Pricing' })
  @IsOptional()
  @IsString()
  sub_category?: string | null;

  @ApiPropertyOptional({ example: 24 })
  @IsOptional()
  @IsInt()
  @Min(1)
  sla_hours?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requires_attachment?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requires_description?: boolean;

  @ApiPropertyOptional({ description: 'UUID of parent category for nesting' })
  @IsOptional()
  @IsUUID()
  parent_category_id?: string | null;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  display_order?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
