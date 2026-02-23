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
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';
import { RefundsService } from './refunds.service.js';
import { CreateRefundDto } from './dto/createRefund.dto.js';
import { UpdateRefundDto } from './dto/updateRefund.dto.js';
import { GetRefundsDto } from './dto/getRefunds.dto.js';
import { AddRefundActionDto } from './dto/addRefundAction.dto.js';

@ApiTags('refunds')
@Controller('refunds')
export class RefundsController {
  constructor(private readonly refunds_service: RefundsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a refund request' })
  @ApiCreatedResponse({ description: 'Refund request created' })
  async create(@Body() dto: CreateRefundDto) {
    return this.refunds_service.create(dto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get refund request summary stats' })
  @ApiOkResponse({ description: 'Refund stats' })
  async get_stats() {
    return this.refunds_service.get_stats();
  }

  @Get()
  @ApiOperation({ summary: 'List refund requests with filters' })
  @ApiOkResponse({ description: 'Paginated list of refund requests' })
  async find_all(@Query() dto: GetRefundsDto) {
    return this.refunds_service.find_all(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single refund request with products and actions' })
  @ApiParam({ name: 'id', description: 'Refund request UUID' })
  async find_one(@Param('id', ParseUUIDPipe) id: string) {
    return this.refunds_service.find_one(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a refund request' })
  @ApiParam({ name: 'id', description: 'Refund request UUID' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRefundDto,
  ) {
    return this.refunds_service.update(id, dto);
  }

  @Post(':id/actions')
  @ApiOperation({ summary: 'Add an action to a refund request' })
  @ApiParam({ name: 'id', description: 'Refund request UUID' })
  @ApiCreatedResponse({ description: 'Action added' })
  async add_action(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddRefundActionDto,
  ) {
    return this.refunds_service.add_action(id, dto);
  }
}
