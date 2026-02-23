import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateConversationDto {
  @ApiPropertyOptional({
    description: 'New status',
    enum: ['open', 'resolved', 'archived'],
  })
  @IsOptional()
  @IsIn(['open', 'resolved', 'archived'])
  status?: string;

  @ApiPropertyOptional({
    example: 'support',
    description: 'Assigned team',
  })
  @IsOptional()
  @IsString()
  assigned_team?: string;

  @ApiPropertyOptional({
    example: 'agent_abc123',
    description: 'Assigned agent ID',
  })
  @IsOptional()
  @IsString()
  assigned_agent?: string;
}
