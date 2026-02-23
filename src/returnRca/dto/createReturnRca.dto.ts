import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

const FAULT_CATEGORIES = ['sales', 'customer', 'delivery', 'quality'] as const;

export class CreateReturnRcaDto {
  @ApiPropertyOptional() @IsOptional() @IsString() order_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customer_phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customer_name?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) order_value?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() return_reason?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}

export class ClassifyReturnRcaDto {
  @ApiProperty({ enum: FAULT_CATEGORIES }) @IsIn([...FAULT_CATEGORIES]) fault_category: string;
  @ApiPropertyOptional() @IsOptional() @IsString() classified_by?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
