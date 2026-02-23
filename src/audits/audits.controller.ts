import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AuditsService, AuditRow, AuditStats } from './audits.service.js';
import { GetAuditsDto } from './dto/getAudits.dto.js';
import { UpdateAuditDto } from './dto/updateAudit.dto.js';

@ApiTags('audits')
@Controller('audits')
export class AuditsController {
  constructor(private readonly audits_service: AuditsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get audit summary statistics' })
  @ApiOkResponse({ description: 'Audit stats: total, pending, completed, flagged, avg_score' })
  async get_stats(): Promise<AuditStats> {
    return this.audits_service.get_stats();
  }

  @Get()
  @ApiOperation({ summary: 'List audits with filters and pagination' })
  @ApiOkResponse({ description: 'Paginated list of audits' })
  async find_all(@Query() dto: GetAuditsDto): Promise<{ data: AuditRow[]; total: number }> {
    return this.audits_service.find_all(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single audit by ID' })
  @ApiParam({ name: 'id', description: 'Audit UUID' })
  async find_one(@Param('id', ParseUUIDPipe) id: string): Promise<AuditRow> {
    return this.audits_service.find_one(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an audit (score, notes, status, audited_by)' })
  @ApiParam({ name: 'id', description: 'Audit UUID' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAuditDto,
  ): Promise<AuditRow> {
    return this.audits_service.update(id, dto);
  }
}
