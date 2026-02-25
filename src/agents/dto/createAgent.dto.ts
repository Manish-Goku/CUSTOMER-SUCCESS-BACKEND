import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsIn,
  IsBoolean,
  IsArray,
  IsUUID,
  IsEmail,
  MinLength,
} from 'class-validator';

const AGENT_STATUSES = [
  'available',
  'on_call',
  'wrap_up',
  'break',
  'offline',
] as const;

export class CreateAgentDto {
  @ApiPropertyOptional({ description: 'Supabase auth user ID' })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiProperty({ example: 'Manish Pandey' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ example: 'manish@katyayani.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ default: 'general' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ default: '2nd' })
  @IsOptional()
  @IsString()
  floor?: string;

  @ApiPropertyOptional({ enum: AGENT_STATUSES, default: 'offline' })
  @IsOptional()
  @IsIn(AGENT_STATUSES)
  status?: string;

  @ApiPropertyOptional({ type: [String], default: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ enum: ['super_admin', 'admin', 'agent'], default: 'agent' })
  @IsOptional()
  @IsIn(['super_admin', 'admin', 'agent'])
  role?: string;

  @ApiPropertyOptional({ description: 'ID of the admin this agent reports to' })
  @IsOptional()
  @IsUUID()
  admin_id?: string;
}
