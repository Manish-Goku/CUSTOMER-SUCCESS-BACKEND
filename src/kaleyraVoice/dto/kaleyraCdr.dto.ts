import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * Kaleyra CDR (Call Detail Record) webhook payload.
 * Sent by Kaleyra after each call ends via the account-wide callback URL.
 * All fields optional — Kaleyra may omit some depending on call type.
 */
export class KaleyraCdrDto {
  @ApiPropertyOptional({ description: 'Unique call record ID' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ description: 'Alternative call ID' })
  @IsOptional()
  @IsString()
  call_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  uniqid?: string;

  @ApiPropertyOptional({ description: 'Caller number' })
  @IsOptional()
  @IsString()
  callfrom?: string;

  @ApiPropertyOptional({ description: 'Alternative caller field' })
  @IsOptional()
  @IsString()
  caller?: string;

  @ApiPropertyOptional({ description: 'Receiver number' })
  @IsOptional()
  @IsString()
  callto?: string;

  @ApiPropertyOptional({ description: 'Alternative receiver field' })
  @IsOptional()
  @IsString()
  receiver?: string;

  @ApiPropertyOptional({ description: 'Call start time (YYYY-MM-DD HH:mm:ss IST)' })
  @IsOptional()
  @IsString()
  start_time?: string;

  @ApiPropertyOptional({ description: 'Call end time' })
  @IsOptional()
  @IsString()
  end_time?: string;

  @ApiPropertyOptional()
  @IsOptional()
  duration?: number | string;

  @ApiPropertyOptional()
  @IsOptional()
  billsec?: number | string;

  @ApiPropertyOptional({ description: 'Call status: ANSWER, NOANSWER, BUSY, CANCEL, FAILED' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ description: 'Service type: Incoming, CallForward, Click2Call' })
  @IsOptional()
  @IsString()
  service?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  callerid?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recording?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recordpath?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  custom?: string;
}
