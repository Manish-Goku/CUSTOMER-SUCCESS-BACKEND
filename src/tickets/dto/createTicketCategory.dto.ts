import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsBoolean, MinLength } from 'class-validator';

export class CreateTicketCategoryDto {
  @ApiProperty() @IsString() @MinLength(1) name: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) subcategories?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_active?: boolean;
}

export class UpdateTicketCategoryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) subcategories?: string[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_active?: boolean;
}
