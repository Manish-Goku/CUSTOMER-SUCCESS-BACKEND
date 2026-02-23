import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsBoolean, MinLength } from 'class-validator';

const CATEGORIES = ['nps', 'csat', 'product_feedback', 'delivery_feedback', 'custom'] as const;

export class CreateSurveyTemplateDto {
  @ApiProperty() @IsString() @MinLength(1) name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: CATEGORIES }) @IsOptional() @IsIn([...CATEGORIES]) category?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_active?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() created_by?: string;
}

export class UpdateSurveyTemplateDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ enum: CATEGORIES }) @IsOptional() @IsIn([...CATEGORIES]) category?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_active?: boolean;
}
