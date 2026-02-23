import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import {
  CreateQueryAssignmentDto,
  UpdateQueryAssignmentDto,
  GetQueryAssignmentsDto,
  BulkAssignDto,
  QueryAssignmentResponseDto,
} from './dto/queryAssignment.dto.js';

@Injectable()
export class QueryAssignmentsService {
  private readonly logger = new Logger(QueryAssignmentsService.name);

  constructor(private readonly supabase_service: SupabaseService) {}

  async create(dto: CreateQueryAssignmentDto): Promise<QueryAssignmentResponseDto> {
    const { data, error } = await this.supabase_service
      .getClient()
      .from('query_assignments')
      .insert({
        type: dto.type,
        customer_phone: dto.customer_phone,
        customer_name: dto.customer_name || null,
        channel: dto.channel || null,
        state: dto.state || null,
        priority: dto.priority || 'normal',
      })
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to create query assignment', error);
      throw new Error('Failed to create query assignment');
    }

    return data as QueryAssignmentResponseDto;
  }

  async find_all(
    dto: GetQueryAssignmentsDto,
  ): Promise<{ data: QueryAssignmentResponseDto[]; total: number }> {
    const client = this.supabase_service.getClient();
    const page = dto.page || 1;
    const limit = dto.limit || 50;
    const offset = (page - 1) * limit;

    let query = client
      .from('query_assignments')
      .select('*', { count: 'exact' })
      .order('received_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (dto.type) query = query.eq('type', dto.type);
    if (dto.status) query = query.eq('status', dto.status);
    if (dto.search) {
      query = query.or(
        `customer_phone.ilike.%${dto.search}%,customer_name.ilike.%${dto.search}%`,
      );
    }

    const { data, error, count } = await query;

    if (error) {
      this.logger.error('Failed to fetch query assignments', error);
      throw new Error('Failed to fetch query assignments');
    }

    return {
      data: (data || []) as QueryAssignmentResponseDto[],
      total: count || 0,
    };
  }

  async find_one(id: string): Promise<QueryAssignmentResponseDto> {
    const { data, error } = await this.supabase_service
      .getClient()
      .from('query_assignments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Query assignment ${id} not found`);
    }

    return data as QueryAssignmentResponseDto;
  }

  async update(
    id: string,
    dto: UpdateQueryAssignmentDto,
  ): Promise<QueryAssignmentResponseDto> {
    await this.find_one(id);

    const update_data: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.status !== undefined) update_data.status = dto.status;
    if (dto.priority !== undefined) update_data.priority = dto.priority;
    if (dto.assigned_to !== undefined) update_data.assigned_to = dto.assigned_to;
    if (dto.assigned_to_name !== undefined) update_data.assigned_to_name = dto.assigned_to_name;

    if (dto.status === 'completed') {
      update_data.completed_at = new Date().toISOString();
    }

    const { data, error } = await this.supabase_service
      .getClient()
      .from('query_assignments')
      .update(update_data)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to update query assignment', error);
      throw new Error('Failed to update query assignment');
    }

    return data as QueryAssignmentResponseDto;
  }

  async bulk_assign(dto: BulkAssignDto): Promise<{ updated: number }> {
    const { data, error } = await this.supabase_service
      .getClient()
      .from('query_assignments')
      .update({
        assigned_to: dto.assigned_to,
        assigned_to_name: dto.assigned_to_name,
        status: 'assigned',
        updated_at: new Date().toISOString(),
      })
      .in('id', dto.ids)
      .eq('status', 'pending')
      .select('id');

    if (error) {
      this.logger.error('Failed to bulk assign', error);
      throw new Error('Failed to bulk assign query assignments');
    }

    return { updated: data?.length || 0 };
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    await this.find_one(id);

    const { error } = await this.supabase_service
      .getClient()
      .from('query_assignments')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error('Failed to delete query assignment', error);
      throw new Error('Failed to delete query assignment');
    }

    return { success: true, message: 'Query assignment deleted' };
  }
}
