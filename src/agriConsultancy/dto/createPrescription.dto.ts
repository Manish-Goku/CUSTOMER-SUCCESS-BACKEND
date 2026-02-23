import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsUUID } from 'class-validator';

export class PrescriptionProductDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() dosage?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() application_method?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() frequency?: string;
}

export class CreatePrescriptionDto {
  @ApiProperty() @IsUUID() consultation_id: string;
  @ApiPropertyOptional({ type: [PrescriptionProductDto] }) @IsOptional() @IsArray() products?: PrescriptionProductDto[];
  @ApiPropertyOptional() @IsOptional() @IsString() instructions?: string;
}
