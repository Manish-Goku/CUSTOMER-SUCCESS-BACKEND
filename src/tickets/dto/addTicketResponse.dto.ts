import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, MinLength } from 'class-validator';

export class AddTicketResponseDto {
  @ApiProperty() @IsString() @MinLength(1) content: string;
  @ApiPropertyOptional() @IsOptional() @IsIn(['agent', 'customer', 'system']) sender_type?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() created_by?: string;
}
