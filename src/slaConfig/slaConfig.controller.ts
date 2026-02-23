import {
  Controller,
  Get,
  Put,
  Body,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';
import { SlaConfigService } from './slaConfig.service.js';
import {
  UpdateSlaConfigDto,
  BulkUpdateSlaConfigDto,
  SlaConfigResponseDto,
} from './dto/updateSlaConfig.dto.js';

@ApiTags('sla-config')
@Controller('sla-config')
export class SlaConfigController {
  constructor(private readonly sla_config_service: SlaConfigService) {}

  @Get()
  @ApiOperation({ summary: 'List all SLA configurations (one per tier)' })
  @ApiOkResponse({ type: [SlaConfigResponseDto] })
  async find_all(): Promise<SlaConfigResponseDto[]> {
    return this.sla_config_service.find_all();
  }

  @Put('bulk')
  @ApiOperation({ summary: 'Bulk update SLA configurations for multiple tiers' })
  @ApiOkResponse({ type: [SlaConfigResponseDto] })
  async bulk_update(
    @Body() dto: BulkUpdateSlaConfigDto,
  ): Promise<SlaConfigResponseDto[]> {
    return this.sla_config_service.bulk_update(dto.items);
  }

  @Get(':tier')
  @ApiOperation({ summary: 'Get SLA configuration for a specific tier' })
  @ApiParam({ name: 'tier', enum: ['vip', 'high', 'normal', 'low'] })
  @ApiOkResponse({ type: SlaConfigResponseDto })
  async find_by_tier(
    @Param('tier') tier: string,
  ): Promise<SlaConfigResponseDto> {
    return this.sla_config_service.find_by_tier(tier);
  }

  @Put(':tier')
  @ApiOperation({ summary: 'Update SLA configuration for a specific tier' })
  @ApiParam({ name: 'tier', enum: ['vip', 'high', 'normal', 'low'] })
  @ApiOkResponse({ type: SlaConfigResponseDto })
  async update_by_tier(
    @Param('tier') tier: string,
    @Body() dto: UpdateSlaConfigDto,
  ): Promise<SlaConfigResponseDto> {
    return this.sla_config_service.update_by_tier(tier, dto);
  }
}
