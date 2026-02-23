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
import { TicketCategoriesService } from './ticketCategories.service.js';
import { CreateTicketCategoryDto, UpdateTicketCategoryDto } from './dto/createTicketCategory.dto.js';

@ApiTags('ticket-categories')
@Controller('ticket-categories')
export class TicketCategoriesController {
  constructor(private readonly ticket_categories_service: TicketCategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a ticket category' })
  async create(@Body() dto: CreateTicketCategoryDto) {
    return this.ticket_categories_service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all ticket categories' })
  async find_all() {
    return this.ticket_categories_service.find_all();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a ticket category' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketCategoryDto,
  ) {
    return this.ticket_categories_service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a ticket category' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.ticket_categories_service.remove(id);
  }
}
