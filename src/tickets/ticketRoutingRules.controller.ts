import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TicketRoutingRulesService, CreateTicketRoutingRuleDto, UpdateTicketRoutingRuleDto } from './ticketRoutingRules.service.js';

@ApiTags('ticket-routing-rules')
@Controller('ticket-routing-rules')
export class TicketRoutingRulesController {
  constructor(private readonly ticket_routing_rules_service: TicketRoutingRulesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a routing rule' })
  async create(@Body() dto: CreateTicketRoutingRuleDto) {
    return this.ticket_routing_rules_service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all routing rules' })
  async find_all() {
    return this.ticket_routing_rules_service.find_all();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a routing rule' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketRoutingRuleDto,
  ) {
    return this.ticket_routing_rules_service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a routing rule' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticket_routing_rules_service.remove(id);
  }

  @Post(':id/toggle')
  @ApiOperation({ summary: 'Toggle routing rule active status' })
  async toggle(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticket_routing_rules_service.toggle(id);
  }
}
