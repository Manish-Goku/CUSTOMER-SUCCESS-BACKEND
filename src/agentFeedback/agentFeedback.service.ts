import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { CreateAgentFeedbackDto, UpdateAgentFeedbackDto } from './dto/createAgentFeedback.dto.js';
import { GetAgentFeedbackDto } from './dto/getAgentFeedback.dto.js';

export interface AgentFeedbackRow {
  id: string;
  agent_id: string | null;
  agent_name: string | null;
  feedback_type: string | null;
  rating: number | null;
  sentiment: string | null;
  reference_id: string | null;
  reference_type: string | null;
  customer_id: string | null;
  customer_name: string | null;
  category: string | null;
  subcategory: string | null;
  comment: string | null;
  action_taken: string | null;
  status: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AgentFeedbackStats {
  total: number;
  pending: number;
  reviewed: number;
  actioned: number;
  avg_rating: number;
  by_sentiment: { positive: number; neutral: number; negative: number };
  by_type: Record<string, number>;
}

export interface AgentSummary {
  agent_id: string;
  agent_name: string;
  total_feedback: number;
  avg_rating: number;
  positive: number;
  neutral: number;
  negative: number;
}

@Injectable()
export class AgentFeedbackService {
  private readonly logger = new Logger(AgentFeedbackService.name);

  constructor(private readonly supabase_service: SupabaseService) {}

  async create(dto: CreateAgentFeedbackDto): Promise<AgentFeedbackRow> {
    const client = this.supabase_service.getClient();

    const insert_data: Record<string, unknown> = { status: 'pending' };
    if (dto.agent_id !== undefined) insert_data.agent_id = dto.agent_id;
    if (dto.agent_name !== undefined) insert_data.agent_name = dto.agent_name;
    if (dto.feedback_type !== undefined) insert_data.feedback_type = dto.feedback_type;
    if (dto.rating !== undefined) insert_data.rating = dto.rating;
    if (dto.sentiment !== undefined) insert_data.sentiment = dto.sentiment;
    if (dto.reference_id !== undefined) insert_data.reference_id = dto.reference_id;
    if (dto.reference_type !== undefined) insert_data.reference_type = dto.reference_type;
    if (dto.customer_id !== undefined) insert_data.customer_id = dto.customer_id;
    if (dto.customer_name !== undefined) insert_data.customer_name = dto.customer_name;
    if (dto.category !== undefined) insert_data.category = dto.category;
    if (dto.subcategory !== undefined) insert_data.subcategory = dto.subcategory;
    if (dto.comment !== undefined) insert_data.comment = dto.comment;
    if (dto.action_taken !== undefined) insert_data.action_taken = dto.action_taken;

    const { data, error } = await client
      .from('agent_feedback')
      .insert(insert_data)
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to create agent feedback', error);
      throw new InternalServerErrorException('Failed to create agent feedback');
    }

    return data as AgentFeedbackRow;
  }

  async find_all(dto: GetAgentFeedbackDto): Promise<{ data: AgentFeedbackRow[]; total: number }> {
    const client = this.supabase_service.getClient();
    const page = dto.page || 1;
    const limit = dto.limit || 50;
    const offset = (page - 1) * limit;

    let query = client
      .from('agent_feedback')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (dto.agent_id) query = query.eq('agent_id', dto.agent_id);
    if (dto.feedback_type) query = query.eq('feedback_type', dto.feedback_type);
    if (dto.sentiment) query = query.eq('sentiment', dto.sentiment);
    if (dto.status) query = query.eq('status', dto.status);
    if (dto.search) {
      query = query.or(
        `agent_name.ilike.%${dto.search}%,customer_name.ilike.%${dto.search}%,comment.ilike.%${dto.search}%`,
      );
    }

    const { data, error, count } = await query;

    if (error) {
      this.logger.error('Failed to fetch agent feedback', error);
      throw new InternalServerErrorException('Failed to fetch agent feedback');
    }

    return { data: (data || []) as AgentFeedbackRow[], total: count || 0 };
  }

  async update(id: string, dto: UpdateAgentFeedbackDto): Promise<AgentFeedbackRow> {
    const client = this.supabase_service.getClient();

    const update_data: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.status !== undefined) update_data.status = dto.status;
    if (dto.action_taken !== undefined) update_data.action_taken = dto.action_taken;
    if (dto.comment !== undefined) update_data.comment = dto.comment;
    if (dto.reviewed_by !== undefined) {
      update_data.reviewed_by = dto.reviewed_by;
      update_data.reviewed_at = new Date().toISOString();
    }

    const { data, error } = await client
      .from('agent_feedback')
      .update(update_data)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Agent feedback ${id} not found`);
    }

    return data as AgentFeedbackRow;
  }

  async get_stats(): Promise<AgentFeedbackStats> {
    const client = this.supabase_service.getClient();

    const { data: all_feedback, error } = await client
      .from('agent_feedback')
      .select('status, sentiment, feedback_type, rating');

    if (error) {
      this.logger.error('Failed to fetch feedback stats', error);
      throw new InternalServerErrorException('Failed to fetch feedback stats');
    }

    const items = all_feedback || [];
    const total = items.length;
    const pending = items.filter((f) => f.status === 'pending').length;
    const reviewed = items.filter((f) => f.status === 'reviewed').length;
    const actioned = items.filter((f) => f.status === 'actioned').length;

    const ratings = items.filter((f) => f.rating !== null).map((f) => f.rating as number);
    const avg_rating = ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : 0;

    const by_sentiment = {
      positive: items.filter((f) => f.sentiment === 'positive').length,
      neutral: items.filter((f) => f.sentiment === 'neutral').length,
      negative: items.filter((f) => f.sentiment === 'negative').length,
    };

    const by_type: Record<string, number> = {};
    for (const f of items) {
      if (f.feedback_type) {
        by_type[f.feedback_type] = (by_type[f.feedback_type] || 0) + 1;
      }
    }

    return { total, pending, reviewed, actioned, avg_rating, by_sentiment, by_type };
  }

  async get_agent_summary(): Promise<AgentSummary[]> {
    const client = this.supabase_service.getClient();

    const { data, error } = await client
      .from('agent_feedback')
      .select('agent_id, agent_name, rating, sentiment');

    if (error) {
      this.logger.error('Failed to fetch agent summary', error);
      throw new InternalServerErrorException('Failed to fetch agent summary');
    }

    const items = data || [];
    const grouped: Record<string, { agent_name: string; ratings: number[]; positive: number; neutral: number; negative: number; count: number }> = {};

    for (const f of items) {
      if (!f.agent_id) continue;
      if (!grouped[f.agent_id]) {
        grouped[f.agent_id] = { agent_name: f.agent_name || 'Unknown', ratings: [], positive: 0, neutral: 0, negative: 0, count: 0 };
      }
      grouped[f.agent_id].count++;
      if (f.rating !== null) grouped[f.agent_id].ratings.push(f.rating);
      if (f.sentiment === 'positive') grouped[f.agent_id].positive++;
      else if (f.sentiment === 'neutral') grouped[f.agent_id].neutral++;
      else if (f.sentiment === 'negative') grouped[f.agent_id].negative++;
    }

    return Object.entries(grouped).map(([agent_id, g]) => ({
      agent_id,
      agent_name: g.agent_name,
      total_feedback: g.count,
      avg_rating: g.ratings.length > 0
        ? Math.round((g.ratings.reduce((a, b) => a + b, 0) / g.ratings.length) * 10) / 10
        : 0,
      positive: g.positive,
      neutral: g.neutral,
      negative: g.negative,
    }));
  }
}
