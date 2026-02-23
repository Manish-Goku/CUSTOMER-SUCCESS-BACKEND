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
import { CustomerFeedbackService } from './customerFeedback.service.js';
import { CreateCustomerFeedbackDto, UpdateCustomerFeedbackDto } from './dto/createCustomerFeedback.dto.js';

@ApiTags('customer-feedback')
@Controller('customer-feedback')
export class CustomerFeedbackController {
  constructor(private readonly customer_feedback_service: CustomerFeedbackService) {}

  @Post()
  @ApiOperation({ summary: 'Create customer feedback' })
  async create(@Body() dto: CreateCustomerFeedbackDto) {
    return this.customer_feedback_service.create(dto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get feedback statistics' })
  async get_stats() {
    return this.customer_feedback_service.get_stats();
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get feedback analytics (weekly trend, high-impact)' })
  async get_analytics() {
    return this.customer_feedback_service.get_analytics();
  }

  @Get()
  @ApiOperation({ summary: 'List customer feedback' })
  async find_all(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('priority') priority?: string,
  ) {
    return this.customer_feedback_service.find_all(
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
      status,
      category,
      priority,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer feedback' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerFeedbackDto,
  ) {
    return this.customer_feedback_service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete customer feedback' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.customer_feedback_service.remove(id);
  }
}
