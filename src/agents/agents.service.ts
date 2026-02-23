import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { CreateAgentDto } from './dto/createAgent.dto.js';
import { UpdateAgentDto } from './dto/updateAgent.dto.js';
import { GetAgentsDto } from './dto/getAgents.dto.js';

export interface AgentRow {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  department: string;
  floor: string | null;
  status: string | null;
  skills: string[] | null;
  current_call_id: string | null;
  calls_since_login: number | null;
  avg_handle_time_seconds: number | null;
  total_talk_time_today_seconds: number | null;
  total_break_time_today_seconds: number | null;
  total_work_time_today_seconds: number | null;
  login_time: string | null;
  last_break_start: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AgentDailyStatsRow {
  id: string;
  agent_id: string;
  date: string;
  total_calls: number;
  calls_handled: number;
  calls_missed: number;
  closures: number;
  escalations: number;
  sla_breaches: number;
  avg_handle_time_seconds: number;
  total_talk_time_seconds: number;
  total_break_time_seconds: number;
  total_work_time_seconds: number;
  positive_feedback_count: number;
  neutral_feedback_count: number;
  negative_feedback_count: number;
  created_at: string | null;
  updated_at: string | null;
}

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name);

  constructor(private readonly supabase_service: SupabaseService) {}

  async create(dto: CreateAgentDto): Promise<AgentRow> {
    const client = this.supabase_service.getClient();

    const insert_data: Record<string, unknown> = {
      name: dto.name,
    };

    if (dto.user_id !== undefined) insert_data.user_id = dto.user_id;
    if (dto.email !== undefined) insert_data.email = dto.email;
    if (dto.phone !== undefined) insert_data.phone = dto.phone;
    if (dto.department !== undefined) insert_data.department = dto.department;
    if (dto.floor !== undefined) insert_data.floor = dto.floor;
    if (dto.status !== undefined) insert_data.status = dto.status;
    if (dto.skills !== undefined) insert_data.skills = dto.skills;
    if (dto.is_active !== undefined) insert_data.is_active = dto.is_active;

    const { data, error } = await client
      .from('agents')
      .insert(insert_data)
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to create agent', error);
      throw new InternalServerErrorException('Failed to create agent');
    }

    return data as AgentRow;
  }

  async find_all(
    dto: GetAgentsDto,
  ): Promise<{ data: AgentRow[]; total: number }> {
    const client = this.supabase_service.getClient();
    const page = dto.page || 1;
    const limit = dto.limit || 50;
    const offset = (page - 1) * limit;

    let query = client
      .from('agents')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (dto.department) query = query.eq('department', dto.department);
    if (dto.status) query = query.eq('status', dto.status);
    if (dto.is_active !== undefined) query = query.eq('is_active', dto.is_active);
    if (dto.search) {
      query = query.or(
        `name.ilike.%${dto.search}%,email.ilike.%${dto.search}%,phone.ilike.%${dto.search}%`,
      );
    }

    const { data, error, count } = await query;

    if (error) {
      this.logger.error('Failed to fetch agents', error);
      throw new InternalServerErrorException('Failed to fetch agents');
    }

    return {
      data: (data || []) as AgentRow[],
      total: count || 0,
    };
  }

  async find_one(id: string): Promise<AgentRow> {
    const { data, error } = await this.supabase_service
      .getClient()
      .from('agents')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Agent ${id} not found`);
    }

    return data as AgentRow;
  }

  async update(id: string, dto: UpdateAgentDto): Promise<AgentRow> {
    const client = this.supabase_service.getClient();

    await this.find_one(id);

    const update_data: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.user_id !== undefined) update_data.user_id = dto.user_id;
    if (dto.name !== undefined) update_data.name = dto.name;
    if (dto.email !== undefined) update_data.email = dto.email;
    if (dto.phone !== undefined) update_data.phone = dto.phone;
    if (dto.department !== undefined) update_data.department = dto.department;
    if (dto.floor !== undefined) update_data.floor = dto.floor;
    if (dto.status !== undefined) update_data.status = dto.status;
    if (dto.skills !== undefined) update_data.skills = dto.skills;
    if (dto.is_active !== undefined) update_data.is_active = dto.is_active;

    const { data, error } = await client
      .from('agents')
      .update(update_data)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to update agent', error);
      throw new InternalServerErrorException('Failed to update agent');
    }

    return data as AgentRow;
  }

  async soft_delete(id: string): Promise<{ success: boolean; message: string }> {
    const client = this.supabase_service.getClient();

    await this.find_one(id);

    const { error } = await client
      .from('agents')
      .update({
        is_active: false,
        status: 'offline',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      this.logger.error('Failed to soft-delete agent', error);
      throw new InternalServerErrorException('Failed to soft-delete agent');
    }

    return { success: true, message: 'Agent deactivated' };
  }

  async update_status(id: string, status: string): Promise<AgentRow> {
    const client = this.supabase_service.getClient();

    await this.find_one(id);

    const { data, error } = await client
      .from('agents')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to update agent status', error);
      throw new InternalServerErrorException('Failed to update agent status');
    }

    return data as AgentRow;
  }

  async clock_in(id: string): Promise<AgentRow> {
    const client = this.supabase_service.getClient();

    await this.find_one(id);

    const { data, error } = await client
      .from('agents')
      .update({
        login_time: new Date().toISOString(),
        status: 'available',
        calls_since_login: 0,
        total_talk_time_today_seconds: 0,
        total_break_time_today_seconds: 0,
        total_work_time_today_seconds: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to clock in agent', error);
      throw new InternalServerErrorException('Failed to clock in agent');
    }

    return data as AgentRow;
  }

  async clock_out(id: string): Promise<AgentRow> {
    const client = this.supabase_service.getClient();

    await this.find_one(id);

    const { data, error } = await client
      .from('agents')
      .update({
        status: 'offline',
        login_time: null,
        current_call_id: null,
        last_break_start: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to clock out agent', error);
      throw new InternalServerErrorException('Failed to clock out agent');
    }

    return data as AgentRow;
  }

  async get_stats(id: string): Promise<AgentDailyStatsRow[]> {
    const client = this.supabase_service.getClient();

    await this.find_one(id);

    const seven_days_ago = new Date();
    seven_days_ago.setDate(seven_days_ago.getDate() - 7);
    const date_str = seven_days_ago.toISOString().split('T')[0];

    const { data, error } = await client
      .from('agent_daily_stats')
      .select('*')
      .eq('agent_id', id)
      .gte('date', date_str)
      .order('date', { ascending: false });

    if (error) {
      this.logger.error('Failed to fetch agent stats', error);
      throw new InternalServerErrorException('Failed to fetch agent stats');
    }

    return (data || []) as AgentDailyStatsRow[];
  }
}
