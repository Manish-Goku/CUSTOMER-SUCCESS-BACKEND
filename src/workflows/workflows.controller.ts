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
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WorkflowsService } from './workflows.service.js';
import { CreateWorkflowDto } from './dto/createWorkflow.dto.js';
import { UpdateWorkflowDto } from './dto/updateWorkflow.dto.js';
import { GetWorkflowsDto } from './dto/getWorkflows.dto.js';
import { ExecuteWorkflowDto } from './dto/executeWorkflow.dto.js';

@ApiTags('workflows')
@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflows_service: WorkflowsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a workflow' })
  async create(@Body() dto: CreateWorkflowDto) {
    return this.workflows_service.create(dto);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get all execution logs' })
  async get_all_logs() {
    return this.workflows_service.get_all_logs();
  }

  @Get()
  @ApiOperation({ summary: 'List workflows with filters' })
  async find_all(@Query() dto: GetWorkflowsDto) {
    return this.workflows_service.find_all(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a workflow by ID' })
  async find_one(@Param('id', ParseUUIDPipe) id: string) {
    return this.workflows_service.find_one(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a workflow' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkflowDto,
  ) {
    return this.workflows_service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a workflow' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.workflows_service.remove(id);
  }

  @Post(':id/toggle')
  @ApiOperation({ summary: 'Toggle workflow active status' })
  async toggle(@Param('id', ParseUUIDPipe) id: string) {
    return this.workflows_service.toggle(id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a workflow' })
  async duplicate(@Param('id', ParseUUIDPipe) id: string) {
    return this.workflows_service.duplicate(id);
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Execute a workflow' })
  async execute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExecuteWorkflowDto,
  ) {
    return this.workflows_service.execute(id, dto);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get execution logs for a workflow' })
  async get_logs(@Param('id', ParseUUIDPipe) id: string) {
    return this.workflows_service.get_logs(id);
  }
}
