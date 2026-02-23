import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsEmail, MinLength } from 'class-validator';

const STATUSES = ['new', 'contacted', 'follow_up', 'qualified', 'converted', 'closed', 'not_interested'] as const;
const PRIORITIES = ['high', 'medium', 'low'] as const;

export class CreateYoutubeLeadDto {
  @ApiPropertyOptional() @IsOptional() @IsString() customer_name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() source?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() district?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() query?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional({ enum: PRIORITIES }) @IsOptional() @IsIn([...PRIORITIES]) priority?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() assigned_to?: string;
}

export class UpdateYoutubeLeadDto {
  @ApiPropertyOptional() @IsOptional() @IsString() customer_name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() district?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() query?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional({ enum: STATUSES }) @IsOptional() @IsIn([...STATUSES]) status?: string;
  @ApiPropertyOptional({ enum: PRIORITIES }) @IsOptional() @IsIn([...PRIORITIES]) priority?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() assigned_to?: string;
}
