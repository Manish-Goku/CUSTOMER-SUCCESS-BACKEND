import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsISO8601, IsOptional, IsString, Min, Max, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

// ── Query DTO ──

export class CallDashboardQueryDto {
  @ApiPropertyOptional({
    description: 'Predefined date range',
    enum: ['today', '7d', '30d', 'custom'],
    default: '30d',
  })
  @IsOptional()
  @IsIn(['today', '7d', '30d', 'custom'])
  range?: 'today' | '7d' | '30d' | 'custom' = '30d';

  @ApiPropertyOptional({
    description: 'Custom range start (ISO 8601). Required when range=custom.',
    example: '2026-02-01T00:00:00.000Z',
  })
  @ValidateIf((o) => o.range === 'custom')
  @IsISO8601()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'Custom range end (ISO 8601). Required when range=custom.',
    example: '2026-02-24T23:59:59.999Z',
  })
  @ValidateIf((o) => o.range === 'custom')
  @IsISO8601()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Filter by service type (Incoming, CallForward, Click2Call)' })
  @IsOptional()
  @IsString()
  service?: string;

  @ApiPropertyOptional({ description: 'Filter by agent number' })
  @IsOptional()
  @IsString()
  agent_number?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Results per page', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;
}

export class SyncCallLogsDto {
  @ApiPropertyOptional({
    description: 'From date (YYYY/MM/DD)',
    example: '2026/02/24',
  })
  @IsOptional()
  @IsString()
  from_date?: string;

  @ApiPropertyOptional({
    description: 'To date (YYYY/MM/DD)',
    example: '2026/02/24',
  })
  @IsOptional()
  @IsString()
  to_date?: string;
}

// ── Response DTOs ──

export class CallVolumeDto {
  @ApiProperty({ example: 150 })
  total: number;

  @ApiProperty({ example: 80 })
  incoming: number;

  @ApiProperty({ example: 60 })
  forwarded: number;

  @ApiProperty({ example: 10 })
  click2call: number;
}

export class AgentStatsDto {
  @ApiProperty({ example: '9201972062' })
  agent_number: string;

  @ApiProperty({ example: 25 })
  calls_answered: number;

  @ApiProperty({ example: 3600 })
  total_talk_seconds: number;

  @ApiProperty({ example: 5 })
  missed_calls: number;
}

export class DailyCallVolumeDto {
  @ApiProperty({ example: '2026-02-24' })
  date: string;

  @ApiProperty({ example: 40 })
  incoming: number;

  @ApiProperty({ example: 30 })
  forwarded: number;
}

export class StatusBreakdownDto {
  @ApiProperty({ example: 'ANSWER' })
  status: string;

  @ApiProperty({ example: 85 })
  count: number;
}

export class CallDashboardOverviewDto {
  @ApiProperty({ type: CallVolumeDto })
  call_volume: CallVolumeDto;

  @ApiProperty({ type: [AgentStatsDto] })
  agent_stats: AgentStatsDto[];

  @ApiProperty({ type: [DailyCallVolumeDto] })
  daily_volume: DailyCallVolumeDto[];

  @ApiProperty({ type: [StatusBreakdownDto] })
  status_breakdown: StatusBreakdownDto[];

  @ApiProperty({ example: '2026-02-24T14:30:00.000Z', nullable: true })
  last_synced_at: string | null;
}

export class CallLogRowDto {
  @ApiProperty() id: string;
  @ApiProperty() callfrom: string;
  @ApiProperty() callto: string;
  @ApiProperty() start_time: string;
  @ApiPropertyOptional() end_time?: string;
  @ApiProperty() duration: number;
  @ApiProperty() billsec: number;
  @ApiProperty() status: string;
  @ApiPropertyOptional() location?: string;
  @ApiPropertyOptional() provider?: string;
  @ApiProperty() service: string;
  @ApiPropertyOptional() recording?: string;
}

export class CallListResponseDto {
  @ApiProperty({ type: [CallLogRowDto] })
  data: CallLogRowDto[];

  @ApiProperty({ example: 150 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;
}

export class SyncResultDto {
  @ApiProperty({ example: 45 })
  synced: number;

  @ApiProperty({ example: 'ok' })
  status: string;
}
