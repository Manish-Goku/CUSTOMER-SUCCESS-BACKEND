import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class GetCallCategoriesDto {
  @ApiPropertyOptional({ example: 'Sales' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ description: 'Search in category and sub_category' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

export class CallCategoryResponseDto {
  id: string;
  department: string;
  category: string;
  sub_category: string | null;
  sla_hours: number | null;
  requires_attachment: boolean;
  requires_description: boolean;
  parent_category_id: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface CallCategoryTreeNode extends CallCategoryResponseDto {
  children: CallCategoryTreeNode[];
}
