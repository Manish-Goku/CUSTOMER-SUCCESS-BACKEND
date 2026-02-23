import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { CreateTimelineEventDto } from './dto/createTimelineEvent.dto.js';
import {
  GetTimelineDto,
  TimelineEventResponseDto,
  TimelineSummary,
} from './dto/getTimeline.dto.js';

@Injectable()
export class CustomerTimelineService {
  private readonly logger = new Logger(CustomerTimelineService.name);

  constructor(private readonly supabase_service: SupabaseService) {}

  async create(dto: CreateTimelineEventDto): Promise<TimelineEventResponseDto> {
    const client = this.supabase_service.getClient();

    const { data, error } = await client
      .from('customer_timeline')
      .insert({
        mobile_number: dto.mobile_number,
        event_type: dto.event_type,
        event_id: dto.event_id ?? null,
        title: dto.title,
        description: dto.description ?? null,
        metadata: dto.metadata ?? {},
        agent_id: dto.agent_id ?? null,
      })
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to create timeline event', error);
      throw new Error('Failed to create timeline event');
    }

    return data as TimelineEventResponseDto;
  }

  async find_by_mobile(
    mobile_number: string,
    dto: GetTimelineDto,
  ): Promise<{ data: TimelineEventResponseDto[]; total: number }> {
    const client = this.supabase_service.getClient();
    const page = dto.page || 1;
    const limit = dto.limit || 50;
    const offset = (page - 1) * limit;

    let query = client
      .from('customer_timeline')
      .select('*', { count: 'exact' })
      .eq('mobile_number', mobile_number)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (dto.event_type) {
      query = query.eq('event_type', dto.event_type);
    }

    const { data, error, count } = await query;

    if (error) {
      this.logger.error(
        `Failed to fetch timeline for ${mobile_number}`,
        error,
      );
      throw new Error('Failed to fetch customer timeline');
    }

    return {
      data: (data || []) as TimelineEventResponseDto[],
      total: count || 0,
    };
  }

  async get_summary(mobile_number: string): Promise<TimelineSummary[]> {
    const client = this.supabase_service.getClient();

    const { data, error } = await client
      .from('customer_timeline')
      .select('event_type')
      .eq('mobile_number', mobile_number);

    if (error) {
      this.logger.error(
        `Failed to fetch timeline summary for ${mobile_number}`,
        error,
      );
      throw new Error('Failed to fetch timeline summary');
    }

    if (!data || data.length === 0) {
      return [];
    }

    const count_map = new Map<string, number>();

    for (const row of data) {
      const current = count_map.get(row.event_type) || 0;
      count_map.set(row.event_type, current + 1);
    }

    const summary: TimelineSummary[] = [];
    for (const [event_type, count] of count_map) {
      summary.push({ event_type, count });
    }

    return summary.sort((a, b) => b.count - a.count);
  }
}
