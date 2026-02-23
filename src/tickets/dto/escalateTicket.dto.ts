import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';

export class EscalateTicketDto {
  @ApiProperty() @IsString() @MinLength(1) reason: string;
  @ApiPropertyOptional() @IsOptional() @IsString() escalated_by?: string;
}
