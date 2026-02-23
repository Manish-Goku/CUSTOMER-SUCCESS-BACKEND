import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { CreateCustomerFeedbackDto, UpdateCustomerFeedbackDto } from './dto/createCustomerFeedback.dto.js';

export interface CustomerFeedbackRow {
  id: string;
  problem: string;
  order_id: string | null;
  solution: string | null;
  advice_for_future: string | null;
  category: string | null;
  priority: string | null;
  status: string | null;
  created_by: string | null;
  created_by_name: string | null;
  team_lead: string | null;
  team_lead_name: string | null;
  impact_count: number | null;
  created_at: string | null;
  updated_at: string | null;
}

@Injectable()
export class CustomerFeedbackService {
  private readonly logger = new Logger(CustomerFeedbackService.name);

  constructor(private readonly supabase_service: SupabaseService) {}

  async create(dto: CreateCustomerFeedbackDto): Promise<CustomerFeedbackRow> {
    const client = this.supabase_service.getClient();

    const insert_data: Record<string, unknown> = {
      problem: dto.problem,
      status: 'new',
      category: dto.category ?? 'other',
      priority: dto.priority ?? 'medium',
    };
    if (dto.order_id !== undefined) insert_data.order_id = dto.order_id;
    if (dto.solution !== undefined) insert_data.solution = dto.solution;
    if (dto.advice_for_future !== undefined) insert_data.advice_for_future = dto.advice_for_future;
    if (dto.created_by !== undefined) insert_data.created_by = dto.created_by;
    if (dto.created_by_name !== undefined) insert_data.created_by_name = dto.created_by_name;
    if (dto.team_lead !== undefined) insert_data.team_lead = dto.team_lead;
    if (dto.team_lead_name !== undefined) insert_data.team_lead_name = dto.team_lead_name;
    if (dto.impact_count !== undefined) insert_data.impact_count = dto.impact_count;

    const { data, error } = await client
      .from('customer_feedback')
      .insert(insert_data)
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to create customer feedback', error);
      throw new InternalServerErrorException('Failed to create customer feedback');
    }

    return data as CustomerFeedbackRow;
  }

  async find_all(page = 1, limit = 50, status?: string, category?: string, priority?: string): Promise<{ data: CustomerFeedbackRow[]; total: number }> {
    const client = this.supabase_service.getClient();
    const offset = (page - 1) * limit;

    let query = client
      .from('customer_feedback')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);
    if (priority) query = query.eq('priority', priority);

    const { data, error, count } = await query;

    if (error) {
      this.logger.error('Failed to fetch customer feedback', error);
      throw new InternalServerErrorException('Failed to fetch customer feedback');
    }

    return { data: (data || []) as CustomerFeedbackRow[], total: count || 0 };
  }

  async update(id: string, dto: UpdateCustomerFeedbackDto): Promise<CustomerFeedbackRow> {
    const client = this.supabase_service.getClient();

    const update_data: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.problem !== undefined) update_data.problem = dto.problem;
    if (dto.order_id !== undefined) update_data.order_id = dto.order_id;
    if (dto.solution !== undefined) update_data.solution = dto.solution;
    if (dto.advice_for_future !== undefined) update_data.advice_for_future = dto.advice_for_future;
    if (dto.category !== undefined) update_data.category = dto.category;
    if (dto.priority !== undefined) update_data.priority = dto.priority;
    if (dto.status !== undefined) update_data.status = dto.status;
    if (dto.team_lead !== undefined) update_data.team_lead = dto.team_lead;
    if (dto.team_lead_name !== undefined) update_data.team_lead_name = dto.team_lead_name;
    if (dto.impact_count !== undefined) update_data.impact_count = dto.impact_count;

    const { data, error } = await client
      .from('customer_feedback')
      .update(update_data)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Customer feedback ${id} not found`);
    }

    return data as CustomerFeedbackRow;
  }

  async remove(id: string): Promise<void> {
    const client = this.supabase_service.getClient();
    const { error } = await client.from('customer_feedback').delete().eq('id', id);
    if (error) {
      this.logger.error(`Failed to delete customer feedback ${id}`, error);
      throw new InternalServerErrorException('Failed to delete customer feedback');
    }
  }

  async get_stats(): Promise<Record<string, unknown>> {
    const client = this.supabase_service.getClient();

    const { data, error } = await client
      .from('customer_feedback')
      .select('status, category, priority, impact_count');

    if (error) {
      this.logger.error('Failed to fetch feedback stats', error);
      throw new InternalServerErrorException('Failed to fetch feedback stats');
    }

    const items = data || [];
    const total = items.length;

    const by_category: Record<string, number> = {};
    const by_status: Record<string, number> = {};
    const by_priority: Record<string, number> = {};
    let total_impact = 0;

    for (const item of items) {
      if (item.category) by_category[item.category] = (by_category[item.category] || 0) + 1;
      if (item.status) by_status[item.status] = (by_status[item.status] || 0) + 1;
      if (item.priority) by_priority[item.priority] = (by_priority[item.priority] || 0) + 1;
      total_impact += item.impact_count || 1;
    }

    return { total, total_impact, by_category, by_status, by_priority };
  }

  async get_analytics(): Promise<Record<string, unknown>> {
    const client = this.supabase_service.getClient();

    const { data, error } = await client
      .from('customer_feedback')
      .select('category, priority, impact_count, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Failed to fetch feedback analytics', error);
      throw new InternalServerErrorException('Failed to fetch feedback analytics');
    }

    const items = data || [];

    // Weekly trend (last 4 weeks)
    const now = new Date();
    const weeks: { week: string; count: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const week_start = new Date(now);
      week_start.setDate(week_start.getDate() - (i + 1) * 7);
      const week_end = new Date(now);
      week_end.setDate(week_end.getDate() - i * 7);
      const count = items.filter((item) => {
        const d = new Date(item.created_at);
        return d >= week_start && d < week_end;
      }).length;
      weeks.push({ week: `Week ${4 - i}`, count });
    }

    // High impact items (impact_count >= 3)
    const high_impact = items
      .filter((item) => (item.impact_count || 1) >= 3)
      .slice(0, 10);

    return { weekly_trend: weeks, high_impact };
  }
}
