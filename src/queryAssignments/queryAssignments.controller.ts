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
import { QueryAssignmentsService } from './queryAssignments.service.js';
import {
  CreateQueryAssignmentDto,
  UpdateQueryAssignmentDto,
  GetQueryAssignmentsDto,
  BulkAssignDto,
  QueryAssignmentResponseDto,
} from './dto/queryAssignment.dto.js';

@ApiTags('query-assignments')
@Controller('query-assignments')
export class QueryAssignmentsController {
  constructor(private readonly query_assignments_service: QueryAssignmentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a query assignment' })
  @ApiCreatedResponse({ type: QueryAssignmentResponseDto })
  async create(
    @Body() dto: CreateQueryAssignmentDto,
  ): Promise<QueryAssignmentResponseDto> {
    return this.query_assignments_service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List query assignments with filters' })
  @ApiOkResponse({ description: 'Paginated list of query assignments' })
  async find_all(
    @Query() dto: GetQueryAssignmentsDto,
  ): Promise<{ data: QueryAssignmentResponseDto[]; total: number }> {
    return this.query_assignments_service.find_all(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single query assignment' })
  @ApiParam({ name: 'id', description: 'Query assignment UUID' })
  async find_one(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<QueryAssignmentResponseDto> {
    return this.query_assignments_service.find_one(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a query assignment' })
  @ApiParam({ name: 'id', description: 'Query assignment UUID' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQueryAssignmentDto,
  ): Promise<QueryAssignmentResponseDto> {
    return this.query_assignments_service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a query assignment' })
  @ApiParam({ name: 'id', description: 'Query assignment UUID' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.query_assignments_service.remove(id);
  }

  @Post('bulk-assign')
  @ApiOperation({ summary: 'Bulk assign pending queries to an agent' })
  async bulk_assign(
    @Body() dto: BulkAssignDto,
  ): Promise<{ updated: number }> {
    return this.query_assignments_service.bulk_assign(dto);
  }
}
