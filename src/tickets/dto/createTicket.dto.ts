import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsArray, IsUUID, IsEmail, MinLength } from 'class-validator';

const PRIORITIES = ['critical', 'high', 'medium', 'low'] as const;
const CHANNELS = ['call', 'chat', 'email', 'whatsapp', 'social'] as const;

export class CreateTicketDto {
  @ApiProperty() @IsString() @MinLength(1) subject: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customer_name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() customer_phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() customer_email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() order_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subcategory?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @ApiPropertyOptional({ enum: PRIORITIES }) @IsOptional() @IsIn([...PRIORITIES]) priority?: string;
  @ApiPropertyOptional({ enum: CHANNELS }) @IsOptional() @IsIn([...CHANNELS]) channel?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assigned_to?: string;
}
