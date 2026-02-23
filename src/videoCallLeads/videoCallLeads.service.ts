import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { CreateVideoCallLeadDto } from './dto/createVideoCallLead.dto.js';
import { UpdateVideoCallLeadDto } from './dto/updateVideoCallLead.dto.js';
import { GetVideoCallLeadsDto } from './dto/getVideoCallLeads.dto.js';

export interface VideoCallLeadRow {
  id: string;
  lead_id: string;
  mobile_number: string;
  customer_name: string | null;
  state: string | null;
  call_type: string;
  call_status: string | null;
  call_date: string;
  agent_name: string | null;
  agent_id: string | null;
  order_id: string | null;
  order_amount: number | null;
  crop_name: string | null;
  crop_issue: string | null;
  crop_stage: string | null;
  crop_area: string | null;
  follow_up_date: string | null;
  coupon_code: string | null;
  farmer_remarks: string | null;
  attempt_date: string | null;
  attempt_status: string | null;
  attempt_agent_name: string | null;
  attempt_remark: string | null;
  created_at: string;
  updated_at: string;
}

export interface VideoCallLeadStats {
  total: number;
  by_status: Record<string, number>;
  by_call_type: Record<string, number>;
  today_count: number;
}

@Injectable()
export class VideoCallLeadsService {
  private readonly logger = new Logger(VideoCallLeadsService.name);

  constructor(private readonly supabase_service: SupabaseService) {}

  async create(dto: CreateVideoCallLeadDto): Promise<VideoCallLeadRow> {
    const client = this.supabase_service.getClient();

    // Check for duplicate lead_id
    const { data: existing } = await client
      .from('video_call_leads')
      .select('id')
      .eq('lead_id', dto.lead_id)
      .single();

    if (existing) {
      throw new ConflictException(`Lead with lead_id "${dto.lead_id}" already exists`);
    }

    const insert_data: Record<string, unknown> = {
      lead_id: dto.lead_id,
      mobile_number: dto.mobile_number,
    };

    if (dto.customer_name !== undefined) insert_data.customer_name = dto.customer_name;
    if (dto.state !== undefined) insert_data.state = dto.state;
    if (dto.call_type !== undefined) insert_data.call_type = dto.call_type;
    if (dto.call_status !== undefined) insert_data.call_status = dto.call_status;
    if (dto.call_date !== undefined) insert_data.call_date = dto.call_date;
    if (dto.agent_name !== undefined) insert_data.agent_name = dto.agent_name;
    if (dto.agent_id !== undefined) insert_data.agent_id = dto.agent_id;
    if (dto.order_id !== undefined) insert_data.order_id = dto.order_id;
    if (dto.order_amount !== undefined) insert_data.order_amount = dto.order_amount;
    if (dto.crop_name !== undefined) insert_data.crop_name = dto.crop_name;
    if (dto.crop_issue !== undefined) insert_data.crop_issue = dto.crop_issue;
    if (dto.crop_stage !== undefined) insert_data.crop_stage = dto.crop_stage;
    if (dto.crop_area !== undefined) insert_data.crop_area = dto.crop_area;
    if (dto.follow_up_date !== undefined) insert_data.follow_up_date = dto.follow_up_date;
    if (dto.coupon_code !== undefined) insert_data.coupon_code = dto.coupon_code;
    if (dto.farmer_remarks !== undefined) insert_data.farmer_remarks = dto.farmer_remarks;
    if (dto.attempt_date !== undefined) insert_data.attempt_date = dto.attempt_date;
    if (dto.attempt_status !== undefined) insert_data.attempt_status = dto.attempt_status;
    if (dto.attempt_agent_name !== undefined) insert_data.attempt_agent_name = dto.attempt_agent_name;
    if (dto.attempt_remark !== undefined) insert_data.attempt_remark = dto.attempt_remark;

    const { data, error } = await client
      .from('video_call_leads')
      .insert(insert_data)
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to create video call lead', error);
      throw new Error('Failed to create video call lead');
    }

    return data as VideoCallLeadRow;
  }

  async find_all(
    dto: GetVideoCallLeadsDto,
  ): Promise<{ data: VideoCallLeadRow[]; total: number }> {
    const client = this.supabase_service.getClient();
    const page = dto.page || 1;
    const limit = dto.limit || 50;
    const offset = (page - 1) * limit;

    let query = client
      .from('video_call_leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (dto.call_status) {
      query = query.eq('call_status', dto.call_status);
    }
    if (dto.agent_id) {
      query = query.eq('agent_id', dto.agent_id);
    }
    if (dto.call_date) {
      query = query.eq('call_date', dto.call_date);
    }
    if (dto.search) {
      query = query.or(
        `customer_name.ilike.%${dto.search}%,mobile_number.ilike.%${dto.search}%,lead_id.ilike.%${dto.search}%`,
      );
    }

    const { data, error, count } = await query;

    if (error) {
      this.logger.error('Failed to fetch video call leads', error);
      throw new Error('Failed to fetch video call leads');
    }

    return {
      data: (data || []) as VideoCallLeadRow[],
      total: count || 0,
    };
  }

  async find_one(id: string): Promise<VideoCallLeadRow> {
    const { data, error } = await this.supabase_service
      .getClient()
      .from('video_call_leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Video call lead ${id} not found`);
    }

    return data as VideoCallLeadRow;
  }

  async update(
    id: string,
    dto: UpdateVideoCallLeadDto,
  ): Promise<VideoCallLeadRow> {
    const client = this.supabase_service.getClient();

    await this.find_one(id);

    const update_data: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.customer_name !== undefined) update_data.customer_name = dto.customer_name;
    if (dto.state !== undefined) update_data.state = dto.state;
    if (dto.call_type !== undefined) update_data.call_type = dto.call_type;
    if (dto.call_status !== undefined) update_data.call_status = dto.call_status;
    if (dto.call_date !== undefined) update_data.call_date = dto.call_date;
    if (dto.agent_name !== undefined) update_data.agent_name = dto.agent_name;
    if (dto.agent_id !== undefined) update_data.agent_id = dto.agent_id;
    if (dto.order_id !== undefined) update_data.order_id = dto.order_id;
    if (dto.order_amount !== undefined) update_data.order_amount = dto.order_amount;
    if (dto.crop_name !== undefined) update_data.crop_name = dto.crop_name;
    if (dto.crop_issue !== undefined) update_data.crop_issue = dto.crop_issue;
    if (dto.crop_stage !== undefined) update_data.crop_stage = dto.crop_stage;
    if (dto.crop_area !== undefined) update_data.crop_area = dto.crop_area;
    if (dto.follow_up_date !== undefined) update_data.follow_up_date = dto.follow_up_date;
    if (dto.coupon_code !== undefined) update_data.coupon_code = dto.coupon_code;
    if (dto.farmer_remarks !== undefined) update_data.farmer_remarks = dto.farmer_remarks;
    if (dto.attempt_date !== undefined) update_data.attempt_date = dto.attempt_date;
    if (dto.attempt_status !== undefined) update_data.attempt_status = dto.attempt_status;
    if (dto.attempt_agent_name !== undefined) update_data.attempt_agent_name = dto.attempt_agent_name;
    if (dto.attempt_remark !== undefined) update_data.attempt_remark = dto.attempt_remark;

    const { data, error } = await client
      .from('video_call_leads')
      .update(update_data)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to update video call lead', error);
      throw new Error('Failed to update video call lead');
    }

    return data as VideoCallLeadRow;
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    await this.find_one(id);

    const { error } = await this.supabase_service
      .getClient()
      .from('video_call_leads')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error('Failed to delete video call lead', error);
      throw new Error('Failed to delete video call lead');
    }

    return { success: true, message: 'Video call lead deleted' };
  }

  async get_stats(): Promise<VideoCallLeadStats> {
    const client = this.supabase_service.getClient();

    const { data: all_leads, error } = await client
      .from('video_call_leads')
      .select('call_status, call_type, call_date');

    if (error) {
      this.logger.error('Failed to fetch video call lead stats', error);
      throw new Error('Failed to fetch video call lead stats');
    }

    const rows = all_leads || [];
    const total = rows.length;

    const by_status: Record<string, number> = {};
    for (const row of rows) {
      const status = row.call_status || 'unset';
      by_status[status] = (by_status[status] || 0) + 1;
    }

    const by_call_type: Record<string, number> = {};
    for (const row of rows) {
      const call_type = row.call_type || 'unset';
      by_call_type[call_type] = (by_call_type[call_type] || 0) + 1;
    }

    const today = new Date().toISOString().split('T')[0];
    const today_count = rows.filter((r) => r.call_date === today).length;

    return { total, by_status, by_call_type, today_count };
  }
}
