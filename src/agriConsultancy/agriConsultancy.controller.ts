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
import { AgriConsultancyService } from './agriConsultancy.service.js';
import { CreateConsultationDto, UpdateConsultationDto } from './dto/createConsultation.dto.js';
import { GetConsultationsDto } from './dto/getConsultations.dto.js';
import { CreatePrescriptionDto } from './dto/createPrescription.dto.js';

@ApiTags('agri-consultancy')
@Controller('agri-consultancy')
export class AgriConsultancyController {
  constructor(private readonly agri_consultancy_service: AgriConsultancyService) {}

  @Post()
  @ApiOperation({ summary: 'Schedule a consultation' })
  async create(@Body() dto: CreateConsultationDto) {
    return this.agri_consultancy_service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List consultations with filters' })
  async find_all(@Query() dto: GetConsultationsDto) {
    return this.agri_consultancy_service.find_all(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a consultation' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConsultationDto,
  ) {
    return this.agri_consultancy_service.update(id, dto);
  }

  @Patch(':id/start')
  @ApiOperation({ summary: 'Start a consultation' })
  async start(@Param('id', ParseUUIDPipe) id: string) {
    return this.agri_consultancy_service.start(id);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Complete a consultation' })
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { duration_seconds?: number },
  ) {
    return this.agri_consultancy_service.complete(id, body.duration_seconds);
  }

  @Post('prescriptions')
  @ApiOperation({ summary: 'Create a prescription' })
  async create_prescription(@Body() dto: CreatePrescriptionDto) {
    return this.agri_consultancy_service.create_prescription(dto);
  }

  @Get('prescriptions/:consultation_id')
  @ApiOperation({ summary: 'Get prescriptions for a consultation' })
  async get_prescriptions(@Param('consultation_id', ParseUUIDPipe) consultation_id: string) {
    return this.agri_consultancy_service.get_prescriptions(consultation_id);
  }
}
