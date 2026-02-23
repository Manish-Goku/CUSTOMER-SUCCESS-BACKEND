import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  ValidateNested,
  IsUUID,
  IsString,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ModuleAccessItemDto {
  @ApiProperty({ description: 'UUID of the module' })
  @IsUUID()
  module_id: string;

  @ApiProperty({ example: 'read', description: 'Access level (e.g. read, write, full)' })
  @IsOptional()
  @IsString()
  access_level?: string;
}

export class UpdateModuleAccessDto {
  @ApiProperty({ type: [ModuleAccessItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModuleAccessItemDto)
  modules: ModuleAccessItemDto[];
}
