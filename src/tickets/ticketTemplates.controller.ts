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
import { TicketTemplatesService } from './ticketTemplates.service.js';
import { CreateTicketTemplateDto, UpdateTicketTemplateDto } from './dto/createTicketTemplate.dto.js';

@ApiTags('ticket-templates')
@Controller('ticket-templates')
export class TicketTemplatesController {
  constructor(private readonly ticket_templates_service: TicketTemplatesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a ticket template' })
  async create(@Body() dto: CreateTicketTemplateDto) {
    return this.ticket_templates_service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all ticket templates' })
  async find_all() {
    return this.ticket_templates_service.find_all();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a ticket template' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketTemplateDto,
  ) {
    return this.ticket_templates_service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a ticket template' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticket_templates_service.remove(id);
  }

  @Post(':id/increment-usage')
  @ApiOperation({ summary: 'Increment template usage count' })
  async increment_usage(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticket_templates_service.increment_usage(id);
  }
}
