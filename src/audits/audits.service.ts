import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { GetAuditsDto } from './dto/getAudits.dto.js';
import { UpdateAuditDto } from './dto/updateAudit.dto.js';

export interface AuditRow {
  id: string;
  interaction_type: string;
  interaction_id: string;
  agent_id: string | null;
  agent_name: string | null;
  customer_phone: string;
  customer_name: string | null;
  duration_seconds: number | null;
  category: string | null;
  status: string;
  is_unusual: boolean;
  unusual_reason: string | null;
  recording_url: string | null;
  audit_score: number | null;
  audited_by: string | null;
  audit_notes: string | null;
  audited_at: string | null;
  audit_responses: Record<string, unknown>;
  interaction_timestamp: string;
  created_at: string;
  updated_at: string;
}

export interface AuditStats {
  total: number;
  pending: number;
  completed: number;
  flagged: number;
  avg_score: number | null;
}

@Injectable()
export class AuditsService {
  private readonly logger = new Logger(AuditsService.name);

  constructor(private readonly supabase_service: SupabaseService) {}

  async find_all(
    dto: GetAuditsDto,
  ): Promise<{ data: AuditRow[]; total: number }> {
    const client = this.supabase_service.getClient();
    const page = dto.page || 1;
    const limit = dto.limit || 50;
    const offset = (page - 1) * limit;

    let query = client
      .from('audits')
      .select('*', { count: 'exact' })
      .order('interaction_timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (dto.interaction_type) {
      query = query.eq('interaction_type', dto.interaction_type);
    }
    if (dto.status) {
      query = query.eq('status', dto.status);
    }
    if (dto.agent_id) {
      query = query.eq('agent_id', dto.agent_id);
    }
    if (dto.is_unusual !== undefined) {
      query = query.eq('is_unusual', dto.is_unusual);
    }

    const { data, error, count } = await query;

    if (error) {
      this.logger.error('Failed to fetch audits', error);
      throw new Error('Failed to fetch audits');
    }

    return {
      data: (data || []) as AuditRow[],
      total: count || 0,
    };
  }

  async find_one(id: string): Promise<AuditRow> {
    const { data, error } = await this.supabase_service
      .getClient()
      .from('audits')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Audit ${id} not found`);
    }

    return data as AuditRow;
  }

  async update(id: string, dto: UpdateAuditDto): Promise<AuditRow> {
    const client = this.supabase_service.getClient();

    await this.find_one(id);

    const update_data: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.audit_score !== undefined) update_data.audit_score = dto.audit_score;
    if (dto.audit_notes !== undefined) update_data.audit_notes = dto.audit_notes;
    if (dto.status !== undefined) update_data.status = dto.status;
    if (dto.audited_by !== undefined) update_data.audited_by = dto.audited_by;
    if (dto.is_unusual !== undefined) update_data.is_unusual = dto.is_unusual;
    if (dto.unusual_reason !== undefined) update_data.unusual_reason = dto.unusual_reason;
    if (dto.category !== undefined) update_data.category = dto.category;
    if (dto.audit_responses !== undefined) update_data.audit_responses = dto.audit_responses;

    // Set audited_at when marking as completed or when audited_by is provided
    if (dto.status === 'completed' || dto.audited_by !== undefined) {
      update_data.audited_at = new Date().toISOString();
    }

    const { data, error } = await client
      .from('audits')
      .update(update_data)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to update audit', error);
      throw new Error('Failed to update audit');
    }

    return data as AuditRow;
  }

  async get_stats(): Promise<AuditStats> {
    const client = this.supabase_service.getClient();

    const { data: all_audits, error } = await client
      .from('audits')
      .select('status, audit_score');

    if (error) {
      this.logger.error('Failed to fetch audit stats', error);
      throw new Error('Failed to fetch audit stats');
    }

    const rows = all_audits || [];
    const total = rows.length;
    const pending = rows.filter((r) => r.status === 'pending').length;
    const completed = rows.filter((r) => r.status === 'completed').length;
    const flagged = rows.filter((r) => r.status === 'flagged').length;

    const scored_rows = rows.filter(
      (r) => r.audit_score !== null && r.audit_score !== undefined,
    );
    const avg_score =
      scored_rows.length > 0
        ? Math.round(
            scored_rows.reduce((sum, r) => sum + (r.audit_score as number), 0) /
              scored_rows.length,
          )
        : null;

    return { total, pending, completed, flagged, avg_score };
  }
}
