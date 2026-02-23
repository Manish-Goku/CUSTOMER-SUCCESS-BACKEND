import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class ExecuteWorkflowDto {
  @ApiPropertyOptional() @IsOptional() @IsString() triggered_by?: string;
  @ApiPropertyOptional() @IsOptional() trigger_data?: Record<string, unknown>;
}
