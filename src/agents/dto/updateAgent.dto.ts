import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdateAgentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  floor?: string;

  @ApiPropertyOptional({ enum: AGENT_STATUSES })
  @IsOptional()
  @IsIn(AGENT_STATUSES)
  status?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateAgentStatusDto {
  @ApiPropertyOptional({
    enum: AGENT_STATUSES,
    description: 'Quick status change',
  })
  @IsIn(AGENT_STATUSES)
  status: string;
}
