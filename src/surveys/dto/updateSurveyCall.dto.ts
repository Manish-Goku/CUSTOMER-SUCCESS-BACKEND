import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsArray, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export class SurveyResponseItemDto {
  @ApiProperty() @IsString() question_id: string;
  @ApiProperty() @IsString() answer: string;
}

export class CompleteSurveyCallDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(10) nps_score?: number;
  @ApiPropertyOptional({ type: [SurveyResponseItemDto] }) @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => SurveyResponseItemDto) responses?: SurveyResponseItemDto[];
}

export class ScheduleSurveyCallDto {
  @ApiProperty() @IsDateString() scheduled_at: string;
}
