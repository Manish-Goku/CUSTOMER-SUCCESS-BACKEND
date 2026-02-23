import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class UpdateWorkflowDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() trigger_type?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() trigger_label?: string;
  @ApiPropertyOptional() @IsOptional() trigger_conditions?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() trigger_config?: Record<string, unknown>;
  @ApiPropertyOptional() @IsOptional() @IsArray() actions?: Record<string, unknown>[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_active?: boolean;
}
