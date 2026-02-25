import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import axios from 'axios';
import { SupabaseService } from '../supabase/supabase.service.js';
import { SyncResultDto } from './dto/callDashboard.dto.js';

// Legacy Kaleyra Voice API (api-voice.kaleyra.com)
// All endpoints use POST /v1/ with a `method` form param
// Docs: https://apidocs-voice.kaleyra.com/

@Injectable()
export class KaleyraVoiceService implements OnModuleInit {
  private readonly logger = new Logger(KaleyraVoiceService.name);
  private readonly base_url = 'https://api-voice.kaleyra.com/v1/';
  private readonly api_key: string;
  private readonly callback_url: string;
  private last_auto_synced_at: string | null = null;

  constructor(
    private readonly config_service: ConfigService,
    private readonly supabase_service: SupabaseService,
    private readonly scheduler_registry: SchedulerRegistry,
  ) {
    this.api_key = this.config_service.getOrThrow<string>('KALEYRA_API_KEY');
    this.callback_url = this.config_service.getOrThrow<string>('KALEYRA_CALLBACK_URL');
  }

  onModuleInit() {
    const interval_minutes = Number(this.config_service.get('KALEYRA_SYNC_INTERVAL_MINUTES', '10'));
    const interval_ms = interval_minutes * 60_000;

    const interval = setInterval(() => this.auto_sync_call_logs(), interval_ms);
    this.scheduler_registry.addInterval('kaleyra-auto-sync', interval);

    this.logger.log(`Kaleyra auto-sync scheduled every ${interval_minutes} minutes`);
  }

  private async auto_sync_call_logs(): Promise<void> {
    this.logger.log('Kaleyra auto-sync: starting...');
    try {
      // Sync last 24h
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      const fmt = (d: Date) =>
        `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;

      const result = await this.sync_call_logs(fmt(yesterday), fmt(now));
      this.last_auto_synced_at = new Date().toISOString();
      this.logger.log(`Kaleyra auto-sync complete: ${result.synced} records`);
    } catch (err) {
      this.logger.error('Kaleyra auto-sync failed', err);
    }
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
      const ivr_rows = rows.map((r) => this.kaleyra_to_ivr_row(r));
      const { error } = await client
        .from('ivr_calls')
        .upsert(ivr_rows, { onConflict: 'call_id' });

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


  // ── CDR Webhook ──

  async process_cdr_webhook(payload: Record<string, unknown>): Promise<{ status: string }> {
    const id = String(payload.id || payload.call_id || '');
    if (!id) {
      this.logger.warn('CDR webhook: missing id', payload);
      return { status: 'skipped' };
    }

    const row = {
      id,
      uniqid: payload.uniqid ? String(payload.uniqid) : null,
      callfrom: String(payload.callfrom || payload.caller || ''),
      callto: String(payload.callto || payload.receiver || ''),
      start_time: this.parse_kaleyra_datetime(payload.start_time as string),
      end_time: payload.end_time ? this.parse_kaleyra_datetime(payload.end_time as string) : null,
      duration: Number(payload.duration) || 0,
      billsec: Number(payload.billsec) || 0,
      status: String(payload.status || 'UNKNOWN'),
      location: payload.location ? String(payload.location) : null,
      provider: payload.provider ? String(payload.provider) : null,
      service: String(payload.service || 'Unknown'),
      caller_id: payload.callerid ? String(payload.callerid) : null,
      recording: payload.recording || payload.recordpath ? String(payload.recording || payload.recordpath) : null,
      notes: payload.notes ? String(payload.notes) : null,
      custom: payload.custom ? String(payload.custom) : null,
      synced_at: new Date().toISOString(),
    };

    const client = this.supabase_service.getClient();
    const ivr_row = this.kaleyra_to_ivr_row(row);
    const { error } = await client
      .from('ivr_calls')
      .upsert(ivr_row, { onConflict: 'call_id' });

    if (error) {
      this.logger.error(`CDR webhook upsert failed: ${error.message}`);
      return { status: 'error' };
    }

    this.logger.log(`CDR webhook: upserted call ${id}`);
    return { status: 'ok' };
  }

  // ── Sync Status ──

  async get_sync_status(): Promise<{
    last_synced_at: string | null;
    auto_sync_enabled: boolean;
    sync_interval_minutes: number;
  }> {
    const db_last_synced = await this.get_last_synced_at();
    const interval_minutes = Number(this.config_service.get('KALEYRA_SYNC_INTERVAL_MINUTES', '10'));

    return {
      last_synced_at: this.last_auto_synced_at || db_last_synced,
      auto_sync_enabled: true,
      sync_interval_minutes: interval_minutes,
    };
  }

  private async get_last_synced_at(): Promise<string | null> {
    const client = this.supabase_service.getClient();
    const { data, error } = await client
      .from('ivr_calls')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return data.updated_at as string;
  }

  // ── Private: Kaleyra → ivr_calls mapper ──

  private map_kaleyra_status(raw_status: string): string {
    switch (raw_status.toUpperCase()) {
      case 'ANSWER': return 'completed';
      case 'NOANSWER': return 'missed';
      case 'BUSY': return 'hangup';
      case 'CANCEL': return 'hangup';
      case 'FAILED':
      case 'CONGESTION': return 'missed';
      default: return 'waiting';
    }
  }

  private map_kaleyra_direction(service: string): string {
    switch (service) {
      case 'Click2Call': return 'outbound';
      case 'Incoming': return 'inbound';
      case 'CallForward': return 'inbound';
      default: return 'inbound';
    }
  }

  private kaleyra_to_ivr_row(r: {
    id: string;
    callfrom: string;
    callto: string;
    start_time: string;
    end_time?: string | null;
    duration: number;
    billsec: number;
    status: string;
    location?: string | null;
    service: string;
    recording?: string | null;
    notes?: string | null;
  }): Record<string, unknown> {
    const direction = this.map_kaleyra_direction(r.service);
    // For incoming/forwarded: callfrom = customer, callto = agent
    // For click2call (outbound): callfrom = agent, callto = customer
    const mobile_number = direction === 'outbound' ? r.callto : r.callfrom;
    const agent_name = direction === 'outbound' ? r.callfrom : r.callto;

    return {
      call_id: r.id,
      mobile_number: mobile_number || 'unknown',
      department: 'general',
      did_number: '8068921234',
      status: this.map_kaleyra_status(r.status),
      direction,
      received_at: r.start_time,
      ended_at: r.end_time || null,
      answered_at: r.status.toUpperCase() === 'ANSWER' ? r.start_time : null,
      duration_seconds: r.billsec || r.duration || null,
      agent_name: agent_name || null,
      state: r.location || null,
      recording_url: r.recording || null,
      remark: r.notes || null,
      entry_date: r.start_time ? r.start_time.slice(0, 10) : null,
    };
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
