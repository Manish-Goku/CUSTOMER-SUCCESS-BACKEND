import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { CompleteSurveyCallDto, ScheduleSurveyCallDto, SurveyResponseItemDto } from './dto/updateSurveyCall.dto.js';

export interface SurveyCallRow {
  id: string;
  campaign_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  order_id: string | null;
  status: string | null;
  attempts: number | null;
  nps_score: number | null;
  responses: unknown;
  scheduled_at: string | null;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SurveyAnalytics {
  total_calls: number;
  completed: number;
  not_answered: number;
  completion_rate: number;
  avg_nps: number;
  nps_distribution: { promoters: number; passives: number; detractors: number };
}

@Injectable()
export class SurveyCallsService {
  private readonly logger = new Logger(SurveyCallsService.name);

  constructor(private readonly supabase_service: SupabaseService) {}

  async find_by_campaign(campaign_id: string): Promise<SurveyCallRow[]> {
    const client = this.supabase_service.getClient();

    const { data, error } = await client
      .from('survey_calls')
      .select('*')
      .eq('campaign_id', campaign_id)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Failed to fetch survey calls', error);
      throw new InternalServerErrorException('Failed to fetch survey calls');
    }

    return (data || []) as SurveyCallRow[];
  }

  async complete_call(id: string, dto: CompleteSurveyCallDto): Promise<SurveyCallRow> {
    const client = this.supabase_service.getClient();
    const now = new Date().toISOString();

    const update_data: Record<string, unknown> = {
      status: 'completed',
      completed_at: now,
      updated_at: now,
    };
    if (dto.nps_score !== undefined) update_data.nps_score = dto.nps_score;

    const { data, error } = await client
      .from('survey_calls')
      .update(update_data)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Survey call ${id} not found`);
    }

    // Insert individual responses
    if (dto.responses && dto.responses.length > 0) {
      const response_rows = dto.responses.map((r: SurveyResponseItemDto) => ({
        call_id: id,
        question_id: r.question_id,
        answer: r.answer,
      }));

      const { error: resp_error } = await client
        .from('survey_responses')
        .insert(response_rows);

      if (resp_error) {
        this.logger.error('Failed to insert survey responses', resp_error);
      }
    }

    return data as SurveyCallRow;
  }

  async mark_not_answered(id: string): Promise<SurveyCallRow> {
    const client = this.supabase_service.getClient();

    // First get current attempts
    const { data: current, error: fetch_error } = await client
      .from('survey_calls')
      .select('attempts')
      .eq('id', id)
      .single();

    if (fetch_error || !current) {
      throw new NotFoundException(`Survey call ${id} not found`);
    }

    const { data, error } = await client
      .from('survey_calls')
      .update({
        status: 'not_answered',
        attempts: (current.attempts || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new InternalServerErrorException('Failed to update survey call');
    }

    return data as SurveyCallRow;
  }

  async schedule_call(id: string, dto: ScheduleSurveyCallDto): Promise<SurveyCallRow> {
    const client = this.supabase_service.getClient();

    const { data, error } = await client
      .from('survey_calls')
      .update({
        status: 'call_later',
        scheduled_at: dto.scheduled_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Survey call ${id} not found`);
    }

    return data as SurveyCallRow;
  }

  async get_analytics(campaign_id: string): Promise<SurveyAnalytics> {
    const client = this.supabase_service.getClient();

    const { data: calls, error } = await client
      .from('survey_calls')
      .select('status, nps_score')
      .eq('campaign_id', campaign_id);

    if (error) {
      this.logger.error('Failed to fetch analytics data', error);
      throw new InternalServerErrorException('Failed to fetch analytics');
    }

    const all_calls = calls || [];
    const total_calls = all_calls.length;
    const completed = all_calls.filter((c) => c.status === 'completed').length;
    const not_answered = all_calls.filter((c) => c.status === 'not_answered').length;
    const completion_rate = total_calls > 0 ? Math.round((completed / total_calls) * 100) : 0;

    const scores = all_calls
      .filter((c) => c.nps_score !== null && c.nps_score !== undefined)
      .map((c) => c.nps_score as number);

    const avg_nps = scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : 0;

    const promoters = scores.filter((s) => s >= 9).length;
    const passives = scores.filter((s) => s >= 7 && s <= 8).length;
    const detractors = scores.filter((s) => s <= 6).length;

    return {
      total_calls,
      completed,
      not_answered,
      completion_rate,
      avg_nps,
      nps_distribution: { promoters, passives, detractors },
    };
  }
}
