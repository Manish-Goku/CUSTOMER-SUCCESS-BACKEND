import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AgentFeedbackService } from './agentFeedback.service.js';
import { CreateAgentFeedbackDto, UpdateAgentFeedbackDto } from './dto/createAgentFeedback.dto.js';
import { GetAgentFeedbackDto } from './dto/getAgentFeedback.dto.js';

@ApiTags('agent-feedback')
@Controller('agent-feedback')
export class AgentFeedbackController {
  constructor(private readonly agent_feedback_service: AgentFeedbackService) {}

  @Post()
  @ApiOperation({ summary: 'Create agent feedback' })
  async create(@Body() dto: CreateAgentFeedbackDto) {
    return this.agent_feedback_service.create(dto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get feedback statistics' })
  async get_stats() {
    return this.agent_feedback_service.get_stats();
  }

  @Get('agent-summary')
  @ApiOperation({ summary: 'Get feedback grouped by agent' })
  async get_agent_summary() {
    return this.agent_feedback_service.get_agent_summary();
  }

  @Get()
  @ApiOperation({ summary: 'List agent feedback with filters' })
  async find_all(@Query() dto: GetAgentFeedbackDto) {
    return this.agent_feedback_service.find_all(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update agent feedback' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAgentFeedbackDto,
  ) {
    return this.agent_feedback_service.update(id, dto);
  }
}
