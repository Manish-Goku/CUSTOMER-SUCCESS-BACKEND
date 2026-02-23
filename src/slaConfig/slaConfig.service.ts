import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import {
  UpdateSlaConfigDto,
  BulkUpdateSlaConfigItemDto,
  SlaConfigResponseDto,
} from './dto/updateSlaConfig.dto.js';

const VALID_TIERS = ['vip', 'high', 'normal', 'low'] as const;
type CustomerTier = (typeof VALID_TIERS)[number];

@Injectable()
export class SlaConfigService {
  private readonly logger = new Logger(SlaConfigService.name);

  constructor(private readonly supabase_service: SupabaseService) {}

  async find_all(): Promise<SlaConfigResponseDto[]> {
    const { data, error } = await this.supabase_service
      .getClient()
      .from('sla_configurations')
      .select('*')
      .order('tier', { ascending: true });

    if (error) {
      this.logger.error('Failed to fetch SLA configurations', error);
      throw new Error('Failed to fetch SLA configurations');
    }

    return (data || []) as SlaConfigResponseDto[];
  }

  async find_by_tier(tier: string): Promise<SlaConfigResponseDto> {
    this.validate_tier(tier);

    const { data, error } = await this.supabase_service
      .getClient()
      .from('sla_configurations')
      .select('*')
      .eq('tier', tier)
      .single();

    if (error || !data) {
      throw new NotFoundException(`SLA configuration for tier "${tier}" not found`);
    }

    return data as SlaConfigResponseDto;
  }

  async update_by_tier(
    tier: string,
    dto: UpdateSlaConfigDto,
  ): Promise<SlaConfigResponseDto> {
    this.validate_tier(tier);

    await this.find_by_tier(tier);

    const { data, error } = await this.supabase_service
      .getClient()
      .from('sla_configurations')
      .update({
        response_time_minutes: dto.response_time_minutes,
        resolution_time_minutes: dto.resolution_time_minutes,
        escalation_time_minutes: dto.escalation_time_minutes,
        updated_at: new Date().toISOString(),
      })
      .eq('tier', tier)
      .select()
      .single();

    if (error || !data) {
      this.logger.error(`Failed to update SLA config for tier "${tier}"`, error);
      throw new Error(`Failed to update SLA configuration for tier "${tier}"`);
    }

    return data as SlaConfigResponseDto;
  }

  async bulk_update(
    items: BulkUpdateSlaConfigItemDto[],
  ): Promise<SlaConfigResponseDto[]> {
    if (!items.length) {
      throw new BadRequestException('Items array must not be empty');
    }

    const seen_tiers = new Set<string>();
    for (const item of items) {
      this.validate_tier(item.tier);
      if (seen_tiers.has(item.tier)) {
        throw new BadRequestException(`Duplicate tier "${item.tier}" in bulk update`);
      }
      seen_tiers.add(item.tier);
    }

    const client = this.supabase_service.getClient();
    const results: SlaConfigResponseDto[] = [];

    for (const item of items) {
      const { data, error } = await client
        .from('sla_configurations')
        .update({
          response_time_minutes: item.response_time_minutes,
          resolution_time_minutes: item.resolution_time_minutes,
          escalation_time_minutes: item.escalation_time_minutes,
          updated_at: new Date().toISOString(),
        })
        .eq('tier', item.tier)
        .select()
        .single();

      if (error || !data) {
        this.logger.error(`Failed to update SLA config for tier "${item.tier}"`, error);
        throw new Error(
          `Failed to update SLA configuration for tier "${item.tier}"`,
        );
      }

      results.push(data as SlaConfigResponseDto);
    }

    return results;
  }

  private validate_tier(tier: string): asserts tier is CustomerTier {
    if (!VALID_TIERS.includes(tier as CustomerTier)) {
      throw new BadRequestException(
        `Invalid tier "${tier}". Must be one of: ${VALID_TIERS.join(', ')}`,
      );
    }
  }
}
