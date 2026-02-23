import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, MinLength } from 'class-validator';

export class CreateConsultationDto {
  @ApiProperty() @IsString() @MinLength(1) farmer_name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() farmer_phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() crop_type?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() issue?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduled_at?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() agronomist?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class UpdateConsultationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() farmer_name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() farmer_phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() crop_type?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() issue?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() scheduled_at?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() agronomist?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
