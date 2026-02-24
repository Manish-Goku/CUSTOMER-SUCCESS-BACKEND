import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SupabaseService } from '../supabase/supabase.service.js';
import {
  CallDashboardQueryDto,
  CallDashboardOverviewDto,
  CallVolumeDto,
  AgentStatsDto,
  DailyCallVolumeDto,
  StatusBreakdownDto,
  CallListResponseDto,
  SyncResultDto,
} from './dto/callDashboard.dto.js';

// Legacy Kaleyra Voice API (api-voice.kaleyra.com)
// All endpoints use POST /v1/ with a `method` form param
// Docs: https://apidocs-voice.kaleyra.com/

@Injectable()
export class KaleyraVoiceService {
  private readonly logger = new Logger(KaleyraVoiceService.name);
  private readonly base_url = 'https://api-voice.kaleyra.com/v1/';
  private readonly api_key: string;
  private readonly callback_url: string;

  constructor(
    private readonly config_service: ConfigService,
    private readonly supabase_service: SupabaseService,
  ) {
    this.api_key = this.config_service.getOrThrow<string>('KALEYRA_API_KEY');
    this.callback_url = this.config_service.getOrThrow<string>('KALEYRA_CALLBACK_URL');
  }

  async click_to_call(
    agent_number: string,
    customer_number: string,
    agent_name?: string,
  ): Promise<{ call_id: string; status: string; message: string }> {
    // Build callback URL template with Kaleyra placeholders
    const callback_template = this.build_callback_url();

    const params = new URLSearchParams({
      method: 'dial.click2call',
      api_key: this.api_key,
      caller: agent_number,
      receiver: customer_number,
      callback: callback_template,
      return: '1',
      format: 'json',
    });

    const response = await axios.post(
      this.base_url,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    // Response format: { status: "200", message: "OK", data: { id: "c2c_xxx" } }
    const call_id = response.data?.data?.id || response.data?.id || '';
    if (!call_id) {
      this.logger.error('Kaleyra click-to-call: no call ID in response', response.data);
      throw new Error('Kaleyra API did not return a call ID');
    }

    // Insert initial row in ivr_calls
    const client = this.supabase_service.getClient();
    const { error: insert_error } = await client.from('ivr_calls').insert({
      call_id,
      mobile_number: customer_number,
      agent_name: agent_name || null,
      department: 'outbound',
      status: 'ringing',
      direction: 'outbound',
      received_at: new Date().toISOString(),
    });

    if (insert_error) {
      this.logger.error(`Failed to insert click-to-call row: ${insert_error.message}`);
    }

    this.logger.log(`Click-to-call initiated: ${call_id} (agent=${agent_number}, customer=${customer_number})`);

    return {
      call_id,
      status: 'ringing',
      message: 'Call initiated — agent phone will ring first',
    };
  }

  async outbound_call(
    customer_number: string,
    play: string,
    campaign?: string,
  ): Promise<{ call_id: string; status: string; message: string }> {
    const callback_template = this.build_callback_url();

    const params = new URLSearchParams({
      method: 'voice.call',
      api_key: this.api_key,
      numbers: customer_number,
      play,
      callback: callback_template,
      return: '1',
      format: 'json',
    });

    if (campaign) {
      params.append('campaign', campaign);
    }

    const response = await axios.post(
      this.base_url,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const call_id = response.data?.data?.id || response.data?.id || '';
    if (!call_id) {
      this.logger.error('Kaleyra outbound: no call ID in response', response.data);
      throw new Error('Kaleyra API did not return a call ID');
    }

    const client = this.supabase_service.getClient();
    const { error: insert_error } = await client.from('ivr_calls').insert({
      call_id,
      mobile_number: customer_number,
      department: 'outbound',
      status: 'ringing',
      direction: 'outbound',
      received_at: new Date().toISOString(),
    });

    if (insert_error) {
      this.logger.error(`Failed to insert outbound call row: ${insert_error.message}`);
    }

    this.logger.log(`Outbound call initiated: ${call_id} (customer=${customer_number})`);

    return {
      call_id,
      status: 'ringing',
      message: 'Outbound call initiated',
    };
  }

  /**
   * Process callback from Kaleyra.
   * Kaleyra sends GET requests to the callback URL template with replaced variables:
   * {caller}, {receiver}, {status}, {status1}, {status2}, {duration}, {billsec},
   * {starttime}, {endtime}, {recordpath}, {callerid}
   */
  async process_callback(query: Record<string, string>): Promise<void> {
    const caller = query.caller || '';
    const receiver = query.receiver || '';
    const status = query.status || '';
    const status1 = query.status1 || '';
    const status2 = query.status2 || '';
    const duration = query.duration || '';
    const billsec = query.billsec || '';
    const starttime = query.starttime || '';
    const endtime = query.endtime || '';
    const recordpath = query.recordpath || '';
    const call_id = query.id || '';

    if (!caller && !receiver) {
      this.logger.warn('Kaleyra callback: missing caller/receiver', query);
      return;
    }

    // Find the ivr_calls row by caller+receiver (since click-to-call may not return ID in callback)
    const client = this.supabase_service.getClient();

    // Try finding by call_id first, fallback to receiver (customer number)
    let match_column = 'call_id';
    let match_value = call_id;

    if (!call_id) {
      match_column = 'mobile_number';
      match_value = receiver || caller;
    }

    const update: Record<string, unknown> = {};

    // Map Kaleyra statuses to our internal statuses
    // status1 = caller (agent) leg, status2 = receiver (customer) leg
    const effective_status = status || status2 || status1;

    // Allowed statuses in ivr_calls: waiting, ringing, active, completed, missed, hangup
    switch (effective_status.toUpperCase()) {
      case 'ANSWER':
        update.status = 'completed';
        if (starttime) {
          update.answered_at = this.epoch_to_iso(starttime);
        }
        break;

      case 'BUSY':
        update.status = 'hangup';
        break;

      case 'NOANSWER':
        update.status = 'missed';
        break;

      case 'CANCEL':
        update.status = 'hangup';
        break;

      case 'FAILED':
      case 'CONGESTION':
        update.status = 'missed';
        break;

      default:
        if (effective_status) {
          this.logger.warn(`Kaleyra callback: unknown status "${effective_status}"`);
        }
        break;
    }

    // Duration and timing
    if (duration) {
      update.duration_seconds = Number(duration);
    } else if (billsec) {
      update.duration_seconds = Number(billsec);
    }

    if (endtime) {
      update.ended_at = this.epoch_to_iso(endtime);
    }

    if (recordpath) {
      update.recording_url = recordpath;
    }

    if (Object.keys(update).length === 0) {
      this.logger.warn('Kaleyra callback: nothing to update', query);
      return;
    }

    const { error: update_error } = await client
      .from('ivr_calls')
      .update(update)
      .eq(match_column, match_value)
      .eq('direction', 'outbound');

    if (update_error) {
      this.logger.error(`Failed to update call (${match_column}=${match_value}): ${update_error.message}`);
      return;
    }

    this.logger.log(`Kaleyra callback: ${match_column}=${match_value} → ${update.status}`);
  }

  async get_call_logs(filters?: {
    from_date?: string;
    to_date?: string;
    call_to?: string;
    page?: number;
    limit?: number;
  }): Promise<unknown> {
    const params = new URLSearchParams({
      method: 'dial.c2cstatus',
      api_key: this.api_key,
      format: 'json',
    });

    if (filters?.from_date) params.append('fromdate', filters.from_date);
    if (filters?.to_date) params.append('todate', filters.to_date);
    if (filters?.call_to) params.append('call to', filters.call_to);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const response = await axios.post(
      this.base_url,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    return response.data;
  }

  // ── Sync & Dashboard ──

  async sync_call_logs(from_date?: string, to_date?: string): Promise<SyncResultDto> {
    // Default: today in YYYY/MM/DD
    const now = new Date();
    const default_date = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
    const effective_from = from_date || default_date;
    const effective_to = to_date || default_date;

    let total_synced = 0;
    let page = 1;
    const page_size = 200;

    while (true) {
      const params = new URLSearchParams({
        method: 'dial',
        api_key: this.api_key,
        format: 'json',
        fromdate: effective_from,
        todate: effective_to,
        page: String(page),
        limit: String(page_size),
      });

      let response_data: Record<string, unknown>;
      try {
        const response = await axios.post(this.base_url, params.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        response_data = response.data;
      } catch (err) {
        this.logger.error(`Kaleyra sync fetch failed (page ${page})`, err);
        break;
      }

      const records = (response_data?.data || response_data?.records || []) as Record<string, unknown>[];
      if (!Array.isArray(records) || records.length === 0) break;

      const rows = records.map((r) => ({
        id: String(r.id || ''),
        uniqid: r.uniqid ? String(r.uniqid) : null,
        callfrom: String(r.callfrom || r.caller || ''),
        callto: String(r.callto || r.receiver || ''),
        start_time: this.parse_kaleyra_datetime(r.start_time as string),
        end_time: r.end_time ? this.parse_kaleyra_datetime(r.end_time as string) : null,
        duration: Number(r.duration) || 0,
        billsec: Number(r.billsec) || 0,
        status: String(r.status || 'UNKNOWN'),
        location: r.location ? String(r.location) : null,
        provider: r.provider ? String(r.provider) : null,
        service: String(r.service || 'Unknown'),
        caller_id: r.callerid ? String(r.callerid) : null,
        recording: r.recording ? String(r.recording) : null,
        notes: r.notes ? String(r.notes) : null,
        custom: r.custom ? String(r.custom) : null,
        synced_at: new Date().toISOString(),
      })).filter((row) => row.id);

      if (rows.length === 0) break;

      const client = this.supabase_service.getClient();
      const { error } = await client
        .from('kaleyra_call_logs')
        .upsert(rows, { onConflict: 'id' });

      if (error) {
        this.logger.error(`Sync upsert failed (page ${page}): ${error.message}`);
        break;
      }

      total_synced += rows.length;
      this.logger.log(`Synced page ${page}: ${rows.length} records`);

      if (records.length < page_size) break;
      page++;
    }

    this.logger.log(`Sync complete: ${total_synced} records (${effective_from} → ${effective_to})`);
    return { synced: total_synced, status: 'ok' };
  }

  async get_dashboard_overview(dto: CallDashboardQueryDto): Promise<CallDashboardOverviewDto> {
    const { start_date, end_date } = this.resolve_dates(dto);

    const [call_volume, agent_stats, daily_volume, status_breakdown, last_synced_at] =
      await Promise.all([
        this.rpc_call_volume(start_date, end_date),
        this.rpc_agent_stats(start_date, end_date),
        this.rpc_daily_volume(start_date, end_date),
        this.rpc_status_breakdown(start_date, end_date),
        this.get_last_synced_at(),
      ]);

    return { call_volume, agent_stats, daily_volume, status_breakdown, last_synced_at };
  }

  async get_agent_stats(dto: CallDashboardQueryDto): Promise<AgentStatsDto[]> {
    const { start_date, end_date } = this.resolve_dates(dto);
    return this.rpc_agent_stats(start_date, end_date);
  }

  async get_daily_volume(dto: CallDashboardQueryDto): Promise<DailyCallVolumeDto[]> {
    const { start_date, end_date } = this.resolve_dates(dto);
    return this.rpc_daily_volume(start_date, end_date);
  }

  async get_call_list(dto: CallDashboardQueryDto): Promise<CallListResponseDto> {
    const { start_date, end_date } = this.resolve_dates(dto);
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 50;
    const offset = (page - 1) * limit;

    const client = this.supabase_service.getClient();

    let query = client
      .from('kaleyra_call_logs')
      .select('*', { count: 'exact' })
      .gte('start_time', start_date)
      .lt('start_time', end_date)
      .order('start_time', { ascending: false })
      .range(offset, offset + limit - 1);

    if (dto.service) {
      query = query.eq('service', dto.service);
    }
    if (dto.agent_number) {
      query = query.eq('callto', dto.agent_number);
    }

    const { data, error, count } = await query;

    if (error) {
      this.logger.error('get_call_list failed', error);
      throw error;
    }

    return {
      data: (data ?? []) as CallListResponseDto['data'],
      total: count ?? 0,
      page,
    };
  }

  // ── Private: date resolution ──

  private resolve_dates(dto: CallDashboardQueryDto): { start_date: string; end_date: string } {
    const now = new Date();

    if (dto.range === 'custom') {
      if (!dto.start_date || !dto.end_date) {
        throw new BadRequestException('start_date and end_date required when range=custom');
      }
      return { start_date: dto.start_date, end_date: dto.end_date };
    }

    const end_date = now.toISOString();
    let start: Date;

    switch (dto.range) {
      case 'today':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        break;
      case '7d':
        start = new Date(now);
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
      default:
        start = new Date(now);
        start.setDate(start.getDate() - 30);
        break;
    }

    return { start_date: start.toISOString(), end_date };
  }

  // ── Private: RPC wrappers ──

  private async rpc_call_volume(start_date: string, end_date: string): Promise<CallVolumeDto> {
    const client = this.supabase_service.getClient();
    const { data, error } = await client.rpc('get_kaleyra_call_volume', {
      p_start: start_date,
      p_end: end_date,
    });

    if (error) {
      this.logger.error('get_kaleyra_call_volume RPC failed', error);
      throw error;
    }

    const row = Array.isArray(data) ? data[0] : data;
    return {
      total: Number(row?.total ?? 0),
      incoming: Number(row?.incoming ?? 0),
      forwarded: Number(row?.forwarded ?? 0),
      click2call: Number(row?.click2call ?? 0),
    };
  }

  private async rpc_agent_stats(start_date: string, end_date: string): Promise<AgentStatsDto[]> {
    const client = this.supabase_service.getClient();
    const { data, error } = await client.rpc('get_kaleyra_agent_stats', {
      p_start: start_date,
      p_end: end_date,
    });

    if (error) {
      this.logger.error('get_kaleyra_agent_stats RPC failed', error);
      throw error;
    }

    return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
      agent_number: String(r.agent_number),
      calls_answered: Number(r.calls_answered),
      total_talk_seconds: Number(r.total_talk_seconds),
      missed_calls: Number(r.missed_calls),
    }));
  }

  private async rpc_daily_volume(start_date: string, end_date: string): Promise<DailyCallVolumeDto[]> {
    const client = this.supabase_service.getClient();
    const { data, error } = await client.rpc('get_kaleyra_daily_volume', {
      p_start: start_date,
      p_end: end_date,
    });

    if (error) {
      this.logger.error('get_kaleyra_daily_volume RPC failed', error);
      throw error;
    }

    return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
      date: String(r.date),
      incoming: Number(r.incoming),
      forwarded: Number(r.forwarded),
    }));
  }

  private async rpc_status_breakdown(start_date: string, end_date: string): Promise<StatusBreakdownDto[]> {
    const client = this.supabase_service.getClient();
    const { data, error } = await client.rpc('get_kaleyra_status_breakdown', {
      p_start: start_date,
      p_end: end_date,
    });

    if (error) {
      this.logger.error('get_kaleyra_status_breakdown RPC failed', error);
      throw error;
    }

    return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
      status: String(r.status),
      count: Number(r.count),
    }));
  }

  private async get_last_synced_at(): Promise<string | null> {
    const client = this.supabase_service.getClient();
    const { data, error } = await client
      .from('kaleyra_call_logs')
      .select('synced_at')
      .order('synced_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return data.synced_at as string;
  }

  // ── Private: helpers ──

  private parse_kaleyra_datetime(dt: string | undefined | null): string {
    if (!dt) return new Date().toISOString();
    // Kaleyra format: "2026-02-24 14:45:15" (IST assumed)
    const parsed = new Date(dt.replace(' ', 'T') + '+05:30');
    return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }

  /**
   * Build Kaleyra callback URL template with placeholder variables.
   * Kaleyra replaces {caller}, {receiver}, etc. before hitting our endpoint.
   */
  private build_callback_url(): string {
    const base = this.callback_url;
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}caller={caller}&receiver={receiver}&status={status}&status1={status1}&status2={status2}&duration={duration}&billsec={billsec}&starttime={starttime}&endtime={endtime}&recordpath={recordpath}&callerid={callerid}&id={id}`;
  }

  private epoch_to_iso(epoch: string): string {
    const num = Number(epoch);
    if (isNaN(num)) return new Date().toISOString();
    return new Date(num * 1000).toISOString();
  }
}
