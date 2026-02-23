import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { CreateSurveyCampaignDto, UpdateSurveyCampaignDto } from './dto/createSurveyCampaign.dto.js';

export interface SurveyCampaignRow {
  id: string;
  name: string;
  template_id: string | null;
  template_name: string | null;
  status: string | null;
  target_segment: string | null;
  target_count: number | null;
  start_date: string | null;
  assigned_agents: string[] | null;
  stats: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
}

@Injectable()
export class SurveyCampaignsService {
  private readonly logger = new Logger(SurveyCampaignsService.name);

  constructor(private readonly supabase_service: SupabaseService) {}

  async create(dto: CreateSurveyCampaignDto): Promise<SurveyCampaignRow> {
    const client = this.supabase_service.getClient();

    const insert_data: Record<string, unknown> = {
      name: dto.name,
      status: 'draft',
    };
    if (dto.template_id !== undefined) insert_data.template_id = dto.template_id;
    if (dto.template_name !== undefined) insert_data.template_name = dto.template_name;
    if (dto.target_segment !== undefined) insert_data.target_segment = dto.target_segment;
    if (dto.target_count !== undefined) insert_data.target_count = dto.target_count;
    if (dto.start_date !== undefined) insert_data.start_date = dto.start_date;
    if (dto.assigned_agents !== undefined) insert_data.assigned_agents = dto.assigned_agents;

    const { data, error } = await client
      .from('survey_campaigns')
      .insert(insert_data)
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to create survey campaign', error);
      throw new InternalServerErrorException('Failed to create survey campaign');
    }

    return data as SurveyCampaignRow;
  }

  async find_all(): Promise<SurveyCampaignRow[]> {
    const client = this.supabase_service.getClient();

    const { data, error } = await client
      .from('survey_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Failed to fetch survey campaigns', error);
      throw new InternalServerErrorException('Failed to fetch survey campaigns');
    }

    return (data || []) as SurveyCampaignRow[];
  }

  async find_one(id: string): Promise<SurveyCampaignRow> {
    const client = this.supabase_service.getClient();

    const { data, error } = await client
      .from('survey_campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Survey campaign ${id} not found`);
    }

    return data as SurveyCampaignRow;
  }

  async update(id: string, dto: UpdateSurveyCampaignDto): Promise<SurveyCampaignRow> {
    const client = this.supabase_service.getClient();

    const update_data: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.name !== undefined) update_data.name = dto.name;
    if (dto.target_segment !== undefined) update_data.target_segment = dto.target_segment;
    if (dto.target_count !== undefined) update_data.target_count = dto.target_count;
    if (dto.start_date !== undefined) update_data.start_date = dto.start_date;
    if (dto.assigned_agents !== undefined) update_data.assigned_agents = dto.assigned_agents;

    const { data, error } = await client
      .from('survey_campaigns')
      .update(update_data)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Survey campaign ${id} not found`);
    }

    return data as SurveyCampaignRow;
  }

  async remove(id: string): Promise<void> {
    const client = this.supabase_service.getClient();
    const { error } = await client.from('survey_campaigns').delete().eq('id', id);
    if (error) {
      this.logger.error(`Failed to delete survey campaign ${id}`, error);
      throw new InternalServerErrorException('Failed to delete survey campaign');
    }
  }

  async toggle_status(id: string, status: string): Promise<SurveyCampaignRow> {
    const client = this.supabase_service.getClient();

    const { data, error } = await client
      .from('survey_campaigns')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Survey campaign ${id} not found`);
    }

    return data as SurveyCampaignRow;
  }
}
