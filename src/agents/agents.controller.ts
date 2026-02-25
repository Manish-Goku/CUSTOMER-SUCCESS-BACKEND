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
import { AgentsService } from './agents.service.js';
import { CreateAgentDto } from './dto/createAgent.dto.js';
import { UpdateAgentDto, UpdateAgentStatusDto } from './dto/updateAgent.dto.js';
import { GetAgentsDto } from './dto/getAgents.dto.js';

@ApiTags('agents')
@Controller('agents')
export class AgentsController {
  constructor(private readonly agents_service: AgentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new agent' })
  @ApiCreatedResponse({ description: 'Agent created' })
  async create(@Body() dto: CreateAgentDto) {
    return this.agents_service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List agents with filters and pagination' })
  @ApiOkResponse({ description: 'Paginated list of agents' })
  async find_all(@Query() dto: GetAgentsDto) {
    return this.agents_service.find_all(dto);
  }

  @Get('by-email/:email')
  @ApiOperation({ summary: 'Get agent by email (for login profile lookup)' })
  @ApiParam({ name: 'email', description: 'Agent email' })
  async find_by_email(@Param('email') email: string) {
    return this.agents_service.find_by_email(email);
  }

  @Get('by-user/:user_id')
  @ApiOperation({ summary: 'Get agent by Supabase user_id' })
  @ApiParam({ name: 'user_id', description: 'Supabase auth user UUID' })
  async find_by_user_id(@Param('user_id', ParseUUIDPipe) user_id: string) {
    return this.agents_service.find_by_user_id(user_id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single agent by ID' })
  @ApiParam({ name: 'id', description: 'Agent UUID' })
  async find_one(@Param('id', ParseUUIDPipe) id: string) {
    return this.agents_service.find_one(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update agent fields' })
  @ApiParam({ name: 'id', description: 'Agent UUID' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAgentDto,
  ) {
    return this.agents_service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete an agent (set is_active=false)' })
  @ApiParam({ name: 'id', description: 'Agent UUID' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.agents_service.soft_delete(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Quick status update for an agent' })
  @ApiParam({ name: 'id', description: 'Agent UUID' })
  async update_status(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAgentStatusDto,
  ) {
    return this.agents_service.update_status(id, dto.status);
  }

  @Patch(':id/clock-in')
  @ApiOperation({
    summary: 'Clock in — set login_time, status=available, reset daily counters',
  })
  @ApiParam({ name: 'id', description: 'Agent UUID' })
  async clock_in(@Param('id', ParseUUIDPipe) id: string) {
    return this.agents_service.clock_in(id);
  }

  @Patch(':id/clock-out')
  @ApiOperation({ summary: 'Clock out — set status=offline, clear login_time' })
  @ApiParam({ name: 'id', description: 'Agent UUID' })
  async clock_out(@Param('id', ParseUUIDPipe) id: string) {
    return this.agents_service.clock_out(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get agent daily stats for last 7 days' })
  @ApiParam({ name: 'id', description: 'Agent UUID' })
  async get_stats(@Param('id', ParseUUIDPipe) id: string) {
    return this.agents_service.get_stats(id);
  }

  @Get(':id/team')
  @ApiOperation({ summary: 'Get agents reporting to this admin' })
  @ApiParam({ name: 'id', description: 'Admin agent UUID' })
  async get_team(@Param('id', ParseUUIDPipe) id: string) {
    return this.agents_service.find_my_team(id);
  }
}
