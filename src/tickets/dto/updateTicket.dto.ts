import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsArray, IsUUID, IsEmail, IsDateString } from 'class-validator';

const PRIORITIES = ['critical', 'high', 'medium', 'low'] as const;
const CHANNELS = ['call', 'chat', 'email', 'whatsapp', 'social'] as const;
const STATUSES = ['open', 'in_progress', 'pending_customer', 'escalated', 'resolved', 'closed'] as const;
const SLA_STATUSES = ['on_track', 'at_risk', 'breached'] as const;

export class UpdateTicketDto {
  @ApiPropertyOptional() @IsOptional() @IsString() subject?: string;
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
  @ApiPropertyOptional({ enum: STATUSES }) @IsOptional() @IsIn([...STATUSES]) status?: string;
  @ApiPropertyOptional({ enum: SLA_STATUSES }) @IsOptional() @IsIn([...SLA_STATUSES]) sla_status?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assigned_to?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() follow_up_date?: string;
}
