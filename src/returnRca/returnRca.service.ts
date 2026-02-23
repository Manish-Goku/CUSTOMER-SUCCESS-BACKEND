import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { CreateReturnRcaDto, ClassifyReturnRcaDto } from './dto/createReturnRca.dto.js';

export interface ReturnRcaRow {
  id: string;
  order_id: string | null;
  customer_phone: string | null;
  customer_name: string | null;
  order_value: number | null;
  return_reason: string | null;
  fault_category: string | null;
  status: string | null;
  classified_at: string | null;
  classified_by: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

@Injectable()
export class ReturnRcaService {
  private readonly logger = new Logger(ReturnRcaService.name);

  constructor(private readonly supabase_service: SupabaseService) {}

  async create(dto: CreateReturnRcaDto): Promise<ReturnRcaRow> {
    const client = this.supabase_service.getClient();

    const insert_data: Record<string, unknown> = { status: 'pending' };
    if (dto.order_id !== undefined) insert_data.order_id = dto.order_id;
    if (dto.customer_phone !== undefined) insert_data.customer_phone = dto.customer_phone;
    if (dto.customer_name !== undefined) insert_data.customer_name = dto.customer_name;
    if (dto.order_value !== undefined) insert_data.order_value = dto.order_value;
    if (dto.return_reason !== undefined) insert_data.return_reason = dto.return_reason;
    if (dto.notes !== undefined) insert_data.notes = dto.notes;

    const { data, error } = await client
      .from('return_rca_records')
      .insert(insert_data)
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to create return RCA record', error);
      throw new InternalServerErrorException('Failed to create return RCA record');
    }

    return data as ReturnRcaRow;
  }

  async find_all(page = 1, limit = 50, status?: string, fault_category?: string): Promise<{ data: ReturnRcaRow[]; total: number }> {
    const client = this.supabase_service.getClient();
    const offset = (page - 1) * limit;

    let query = client
      .from('return_rca_records')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (fault_category) query = query.eq('fault_category', fault_category);

    const { data, error, count } = await query;

    if (error) {
      this.logger.error('Failed to fetch return RCA records', error);
      throw new InternalServerErrorException('Failed to fetch return RCA records');
    }

    return { data: (data || []) as ReturnRcaRow[], total: count || 0 };
  }

  async classify(id: string, dto: ClassifyReturnRcaDto): Promise<ReturnRcaRow> {
    const client = this.supabase_service.getClient();
    const now = new Date().toISOString();

    const update_data: Record<string, unknown> = {
      fault_category: dto.fault_category,
      status: 'classified',
      classified_at: now,
      updated_at: now,
    };
    if (dto.classified_by !== undefined) update_data.classified_by = dto.classified_by;
    if (dto.notes !== undefined) update_data.notes = dto.notes;

    const { data, error } = await client
      .from('return_rca_records')
      .update(update_data)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Return RCA record ${id} not found`);
    }

    return data as ReturnRcaRow;
  }

  async get_stats(): Promise<Record<string, unknown>> {
    const client = this.supabase_service.getClient();

    const { data, error } = await client
      .from('return_rca_records')
      .select('status, fault_category, order_value');

    if (error) {
      this.logger.error('Failed to fetch RCA stats', error);
      throw new InternalServerErrorException('Failed to fetch RCA stats');
    }

    const items = data || [];
    const total = items.length;

    const by_status: Record<string, number> = {};
    const by_fault: Record<string, number> = {};
    let total_value = 0;

    for (const item of items) {
      if (item.status) by_status[item.status] = (by_status[item.status] || 0) + 1;
      if (item.fault_category) by_fault[item.fault_category] = (by_fault[item.fault_category] || 0) + 1;
      total_value += Number(item.order_value) || 0;
    }

    return { total, total_value, by_status, by_fault };
  }
}
