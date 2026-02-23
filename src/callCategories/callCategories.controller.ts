import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';
import { CallCategoriesService } from './callCategories.service.js';
import {
  CreateCallCategoryDto,
  UpdateCallCategoryDto,
} from './dto/createCallCategory.dto.js';
import {
  GetCallCategoriesDto,
  CallCategoryResponseDto,
  CallCategoryTreeNode,
} from './dto/getCallCategories.dto.js';

@ApiTags('call-categories')
@Controller('call-categories')
export class CallCategoriesController {
  constructor(
    private readonly call_categories_service: CallCategoriesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a call category' })
  @ApiCreatedResponse({ description: 'Category created' })
  async create(
    @Body() dto: CreateCallCategoryDto,
  ): Promise<CallCategoryResponseDto> {
    return this.call_categories_service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List call categories with filters (hierarchical)' })
  @ApiOkResponse({ description: 'Paginated tree of call categories' })
  async find_all(
    @Query() dto: GetCallCategoriesDto,
  ): Promise<{ data: CallCategoryTreeNode[]; total: number }> {
    return this.call_categories_service.find_all(dto);
  }

  @Get('by-department/:department')
  @ApiOperation({ summary: 'Get categories for a specific department (tree)' })
  @ApiParam({ name: 'department', description: 'Department name' })
  @ApiOkResponse({ description: 'Tree of active categories for department' })
  async find_by_department(
    @Param('department') department: string,
  ): Promise<CallCategoryTreeNode[]> {
    return this.call_categories_service.find_by_department(department);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single call category' })
  @ApiParam({ name: 'id', description: 'Call category UUID' })
  async find_one(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CallCategoryResponseDto> {
    return this.call_categories_service.find_one(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a call category' })
  @ApiParam({ name: 'id', description: 'Call category UUID' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCallCategoryDto,
  ): Promise<CallCategoryResponseDto> {
    return this.call_categories_service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a call category (set is_active=false)' })
  @ApiParam({ name: 'id', description: 'Call category UUID' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.call_categories_service.remove(id);
  }
}
