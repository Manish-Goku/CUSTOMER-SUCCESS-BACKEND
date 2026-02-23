import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetConversationsDto {
  @ApiPropertyOptional({
    description: 'Filter by conversation status',
    enum: ['open', 'resolved', 'archived'],
  })
  @IsOptional()
  @IsIn(['open', 'resolved', 'archived'])
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by assigned team' })
  @IsOptional()
  @IsString()
  team?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
