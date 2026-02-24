import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SupabaseService } from '../supabase/supabase.service.js';

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

    const call_id = response.data?.id || response.data?.call_id || '';
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

    const call_id = response.data?.id || response.data?.call_id || '';
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

    switch (effective_status.toUpperCase()) {
      case 'ANSWER':
        update.status = 'answered';
        if (starttime) {
          update.answered_at = this.epoch_to_iso(starttime);
        }
        break;

      case 'BUSY':
        update.status = 'busy';
        break;

      case 'NOANSWER':
        update.status = 'missed';
        break;

      case 'CANCEL':
        update.status = 'cancelled';
        break;

      case 'FAILED':
      case 'CONGESTION':
        update.status = 'failed';
        break;

      default:
        if (effective_status) {
          this.logger.warn(`Kaleyra callback: unknown status "${effective_status}"`);
          update.status = effective_status.toLowerCase();
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
