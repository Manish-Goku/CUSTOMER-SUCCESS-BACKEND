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
import { ReturnRcaService } from './returnRca.service.js';
import { CreateReturnRcaDto, ClassifyReturnRcaDto } from './dto/createReturnRca.dto.js';

@ApiTags('return-rca')
@Controller('return-rca')
export class ReturnRcaController {
  constructor(private readonly return_rca_service: ReturnRcaService) {}

  @Post()
  @ApiOperation({ summary: 'Create a return RCA record' })
  async create(@Body() dto: CreateReturnRcaDto) {
    return this.return_rca_service.create(dto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get RCA fault distribution stats' })
  async get_stats() {
    return this.return_rca_service.get_stats();
  }

  @Get()
  @ApiOperation({ summary: 'List return RCA records' })
  async find_all(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('fault_category') fault_category?: string,
  ) {
    return this.return_rca_service.find_all(
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
      status,
      fault_category,
    );
  }

  @Patch(':id/classify')
  @ApiOperation({ summary: 'Classify a return RCA record' })
  async classify(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ClassifyReturnRcaDto,
  ) {
    return this.return_rca_service.classify(id, dto);
  }
}
