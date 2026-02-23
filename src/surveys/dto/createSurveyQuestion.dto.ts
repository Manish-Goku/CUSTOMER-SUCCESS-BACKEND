import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsBoolean, IsArray, IsInt, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

const QUESTION_TYPES = ['rating', 'nps', 'single_choice', 'multiple_choice', 'text', 'yes_no'] as const;

export class CreateSurveyQuestionDto {
  @ApiProperty() @IsString() @MinLength(1) question_text: string;
  @ApiPropertyOptional({ enum: QUESTION_TYPES }) @IsOptional() @IsIn([...QUESTION_TYPES]) question_type?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) options?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_required?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_skippable?: boolean;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) sort_order?: number;
}

export class UpdateSurveyQuestionDto {
  @ApiPropertyOptional() @IsOptional() @IsString() question_text?: string;
  @ApiPropertyOptional({ enum: QUESTION_TYPES }) @IsOptional() @IsIn([...QUESTION_TYPES]) question_type?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) options?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_required?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_skippable?: boolean;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) sort_order?: number;
}
