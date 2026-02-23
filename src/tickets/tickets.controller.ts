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
import { TicketsService } from './tickets.service.js';
import { CreateTicketDto } from './dto/createTicket.dto.js';
import { UpdateTicketDto } from './dto/updateTicket.dto.js';
import { GetTicketsDto } from './dto/getTickets.dto.js';
import { EscalateTicketDto } from './dto/escalateTicket.dto.js';
import { AddTicketResponseDto } from './dto/addTicketResponse.dto.js';

@ApiTags('tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly tickets_service: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new ticket' })
  async create(@Body() dto: CreateTicketDto) {
    return this.tickets_service.create(dto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get ticket statistics' })
  async get_stats() {
    return this.tickets_service.get_stats();
  }

  @Get()
  @ApiOperation({ summary: 'List tickets with filters' })
  async find_all(@Query() dto: GetTicketsDto) {
    return this.tickets_service.find_all(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID with responses and timeline' })
  async find_one(@Param('id', ParseUUIDPipe) id: string) {
    return this.tickets_service.find_one(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a ticket' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.tickets_service.update(id, dto);
  }

  @Post(':id/escalate')
  @ApiOperation({ summary: 'Escalate a ticket' })
  async escalate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EscalateTicketDto,
  ) {
    return this.tickets_service.escalate(id, dto);
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Resolve a ticket' })
  async resolve(@Param('id', ParseUUIDPipe) id: string) {
    return this.tickets_service.resolve(id);
  }

  @Post(':id/responses')
  @ApiOperation({ summary: 'Add a response to a ticket' })
  async add_response(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddTicketResponseDto,
  ) {
    return this.tickets_service.add_response(id, dto);
  }
}
