import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { CreateYoutubeLeadDto, UpdateYoutubeLeadDto } from './dto/createYoutubeLead.dto.js';
import { GetYoutubeLeadsDto } from './dto/getYoutubeLeads.dto.js';
import { ActionYoutubeLeadDto, BulkAssignYoutubeLeadDto } from './dto/actionYoutubeLead.dto.js';

export interface YoutubeLeadRow {
  id: string;
  lead_id: string;
  source: string | null;
  customer_name: string | null;
  phone: string | null;
  email: string | null;
  state: string | null;
  district: string | null;
  query: string | null;
  category: string | null;
  status: string | null;
  priority: string | null;
  assigned_to: string | null;
  attempts: number | null;
  last_attempt: string | null;
  notes: unknown;
  is_qualified_lead: boolean | null;
  crm_transferred: boolean | null;
  crm_reference_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

@Injectable()
export class YoutubeLeadsService {
  private readonly logger = new Logger(YoutubeLeadsService.name);

  constructor(private readonly supabase_service: SupabaseService) {}

  private async generate_lead_id(): Promise<string> {
    const client = this.supabase_service.getClient();
    const { data } = await client
      .from('youtube_leads')
      .select('lead_id')
      .order('created_at', { ascending: false })
      .limit(1);

    let next_num = 1;
    if (data && data.length > 0) {
      const num_part = parseInt(data[0].lead_id.replace('YT-', ''), 10);
      if (!isNaN(num_part)) next_num = num_part + 1;
    }

    return `YT-${String(next_num).padStart(4, '0')}`;
  }

  async create(dto: CreateYoutubeLeadDto): Promise<YoutubeLeadRow> {
    const client = this.supabase_service.getClient();
    const lead_id = await this.generate_lead_id();

    const insert_data: Record<string, unknown> = {
      lead_id,
      status: 'new',
      priority: dto.priority ?? 'medium',
    };
    if (dto.customer_name !== undefined) insert_data.customer_name = dto.customer_name;
    if (dto.phone !== undefined) insert_data.phone = dto.phone;
    if (dto.email !== undefined) insert_data.email = dto.email;
    if (dto.source !== undefined) insert_data.source = dto.source;
    if (dto.state !== undefined) insert_data.state = dto.state;
    if (dto.district !== undefined) insert_data.district = dto.district;
    if (dto.query !== undefined) insert_data.query = dto.query;
    if (dto.category !== undefined) insert_data.category = dto.category;
    if (dto.assigned_to !== undefined) insert_data.assigned_to = dto.assigned_to;

    const { data, error } = await client
      .from('youtube_leads')
      .insert(insert_data)
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to create youtube lead', error);
      throw new InternalServerErrorException('Failed to create youtube lead');
    }

    return data as YoutubeLeadRow;
  }

  async find_all(dto: GetYoutubeLeadsDto): Promise<{ data: YoutubeLeadRow[]; total: number }> {
    const client = this.supabase_service.getClient();
    const page = dto.page || 1;
    const limit = dto.limit || 50;
    const offset = (page - 1) * limit;

    let query = client
      .from('youtube_leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (dto.status) query = query.eq('status', dto.status);
    if (dto.priority) query = query.eq('priority', dto.priority);
    if (dto.assigned_to) query = query.eq('assigned_to', dto.assigned_to);
    if (dto.category) query = query.eq('category', dto.category);
    if (dto.is_qualified_lead !== undefined) query = query.eq('is_qualified_lead', dto.is_qualified_lead);
    if (dto.search) {
      query = query.or(
        `customer_name.ilike.%${dto.search}%,lead_id.ilike.%${dto.search}%,phone.ilike.%${dto.search}%`,
      );
    }

    const { data, error, count } = await query;

    if (error) {
      this.logger.error('Failed to fetch youtube leads', error);
      throw new InternalServerErrorException('Failed to fetch youtube leads');
    }

    return { data: (data || []) as YoutubeLeadRow[], total: count || 0 };
  }

  async update(id: string, dto: UpdateYoutubeLeadDto): Promise<YoutubeLeadRow> {
    const client = this.supabase_service.getClient();

    const update_data: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.customer_name !== undefined) update_data.customer_name = dto.customer_name;
    if (dto.phone !== undefined) update_data.phone = dto.phone;
    if (dto.email !== undefined) update_data.email = dto.email;
    if (dto.state !== undefined) update_data.state = dto.state;
    if (dto.district !== undefined) update_data.district = dto.district;
    if (dto.query !== undefined) update_data.query = dto.query;
    if (dto.category !== undefined) update_data.category = dto.category;
    if (dto.status !== undefined) update_data.status = dto.status;
    if (dto.priority !== undefined) update_data.priority = dto.priority;
    if (dto.assigned_to !== undefined) update_data.assigned_to = dto.assigned_to;

    const { data, error } = await client
      .from('youtube_leads')
      .update(update_data)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`YouTube lead ${id} not found`);
    }

    return data as YoutubeLeadRow;
  }

  async action(id: string, dto: ActionYoutubeLeadDto): Promise<YoutubeLeadRow> {
    const client = this.supabase_service.getClient();

    // Get current lead
    const { data: current, error: fetch_error } = await client
      .from('youtube_leads')
      .select('notes, attempts')
      .eq('id', id)
      .single();

    if (fetch_error || !current) {
      throw new NotFoundException(`YouTube lead ${id} not found`);
    }

    const existing_notes = Array.isArray(current.notes) ? current.notes : [];
    const new_note = {
      action: dto.action,
      note: dto.note ?? null,
      performed_by: dto.performed_by ?? null,
      timestamp: new Date().toISOString(),
    };

    const status_map: Record<string, string> = {
      call: 'contacted',
      follow_up: 'follow_up',
      qualify: 'qualified',
      convert: 'converted',
      close: 'closed',
      not_interested: 'not_interested',
    };

    const update_data: Record<string, unknown> = {
      notes: [...existing_notes, new_note],
      attempts: (current.attempts || 0) + 1,
      last_attempt: new Date().toISOString(),
      status: status_map[dto.action] || current.notes,
      updated_at: new Date().toISOString(),
    };

    if (dto.action === 'qualify') {
      update_data.is_qualified_lead = true;
    }

    const { data, error } = await client
      .from('youtube_leads')
      .update(update_data)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new InternalServerErrorException('Failed to perform action on lead');
    }

    return data as YoutubeLeadRow;
  }

  async bulk_assign(dto: BulkAssignYoutubeLeadDto): Promise<{ updated: number }> {
    const client = this.supabase_service.getClient();

    const { data, error } = await client
      .from('youtube_leads')
      .update({
        assigned_to: dto.assigned_to,
        updated_at: new Date().toISOString(),
      })
      .in('id', dto.lead_ids)
      .select();

    if (error) {
      this.logger.error('Failed to bulk assign leads', error);
      throw new InternalServerErrorException('Failed to bulk assign leads');
    }

    return { updated: data?.length || 0 };
  }

  async get_stats(): Promise<Record<string, unknown>> {
    const client = this.supabase_service.getClient();

    const { data, error } = await client
      .from('youtube_leads')
      .select('status, priority, is_qualified_lead');

    if (error) {
      this.logger.error('Failed to fetch lead stats', error);
      throw new InternalServerErrorException('Failed to fetch lead stats');
    }

    const items = data || [];
    const total = items.length;

    const by_status: Record<string, number> = {};
    const by_priority: Record<string, number> = {};
    let qualified = 0;

    for (const item of items) {
      if (item.status) by_status[item.status] = (by_status[item.status] || 0) + 1;
      if (item.priority) by_priority[item.priority] = (by_priority[item.priority] || 0) + 1;
      if (item.is_qualified_lead) qualified++;
    }

    return { total, qualified, by_status, by_priority };
  }
}
