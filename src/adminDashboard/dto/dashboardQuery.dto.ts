import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsISO8601, IsOptional, Max, Min, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class DashboardQueryDto {
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
    example: '2026-02-23T23:59:59.999Z',
  })
  @ValidateIf((o) => o.range === 'custom')
  @IsISO8601()
  end_date?: string;

  @ApiPropertyOptional({
    description: 'Number of top senders to return',
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  top_senders_limit?: number = 10;
}
