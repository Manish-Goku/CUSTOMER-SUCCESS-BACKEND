import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SupabaseService } from '../supabase/supabase.service.js';

interface KaleyraClickToCallResponse {
  data: {
    id: string;
    status: string;
  };
}

interface KaleyraOutboundResponse {
  data: {
    id: string;
    status: string;
  };
}

@Injectable()
export class KaleyraVoiceService {
  private readonly logger = new Logger(KaleyraVoiceService.name);
  private readonly base_url: string;
  private readonly api_key: string;
  private readonly bridge_number: string;
  private readonly callback_url: string;

  constructor(
    private readonly config_service: ConfigService,
    private readonly supabase_service: SupabaseService,
  ) {
    const sid = this.config_service.getOrThrow<string>('KALEYRA_SID');
    this.api_key = this.config_service.getOrThrow<string>('KALEYRA_API_KEY');
    this.bridge_number = this.config_service.getOrThrow<string>('KALEYRA_BRIDGE_NUMBER');
    this.callback_url = this.config_service.getOrThrow<string>('KALEYRA_CALLBACK_URL');
    this.base_url = `https://api.kaleyra.io/v1/${sid}/voice`;
  }

  async click_to_call(
    agent_number: string,
    customer_number: string,
    agent_name?: string,
  ): Promise<{ call_id: string; status: string; message: string }> {
    const params = new URLSearchParams({
      from: agent_number,
      to: customer_number,
      bridge: this.bridge_number,
      callback: this.callback_url,
    });

    const response = await axios.post<KaleyraClickToCallResponse>(
      `${this.base_url}/click-to-call`,
      params.toString(),
      {
        headers: {
          'api-key': this.api_key,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const call_id = response.data?.data?.id;
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
    target?: string,
    bridge?: string,
  ): Promise<{ call_id: string; status: string; message: string }> {
    const params = new URLSearchParams({
      to: customer_number,
      bridge: bridge || this.bridge_number,
      callback: this.callback_url,
    });

    if (target) {
      params.append('target', target);
    }

    const response = await axios.post<KaleyraOutboundResponse>(
      `${this.base_url}/outbound`,
      params.toString(),
      {
        headers: {
          'api-key': this.api_key,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const call_id = response.data?.data?.id;
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

  async process_callback(payload: Record<string, unknown>): Promise<void> {
    const call_id = String(payload.id || payload.call_id || '');
    const event_type = String(payload.status || payload.event || '');

    if (!call_id) {
      this.logger.warn('Kaleyra callback: missing call ID', payload);
      return;
    }

    const update: Record<string, unknown> = {};

    switch (event_type) {
      case 'from_call_start':
        // Agent phone is ringing
        update.status = 'ringing';
        break;

      case 'from_call_answer':
        // Agent answered — now dialing customer
        update.status = 'ringing';
        break;

      case 'to_call_start':
        // Customer phone is ringing
        update.status = 'ringing';
        break;

      case 'to_call_answer':
        // Customer answered — call is active
        update.status = 'active';
        update.answered_at = new Date().toISOString();
        break;

      case 'call_end':
        update.status = 'completed';
        update.ended_at = new Date().toISOString();
        if (payload.duration) {
          update.duration_seconds = Number(payload.duration);
        }
        break;

      default:
        this.logger.warn(`Kaleyra callback: unknown event "${event_type}" for call ${call_id}`);
        update.status = event_type;
        break;
    }

    const client = this.supabase_service.getClient();
    const { error: update_error } = await client
      .from('ivr_calls')
      .update(update)
      .eq('call_id', call_id);

    if (update_error) {
      this.logger.error(`Failed to update call ${call_id}: ${update_error.message}`);
      return;
    }

    this.logger.log(`Kaleyra callback: call ${call_id} → ${update.status}`);
  }

  async get_call_logs(filters?: {
    start_time?: string;
    end_time?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<unknown> {
    const params: Record<string, string> = {
      bridge: this.bridge_number,
    };

    if (filters?.start_time) params.start_time = filters.start_time;
    if (filters?.end_time) params.end_time = filters.end_time;
    if (filters?.status) params.status = filters.status;
    if (filters?.page) params.page = String(filters.page);
    if (filters?.limit) params.offset = String(filters.limit);

    const response = await axios.get(`${this.base_url}/call-logs`, {
      headers: { 'api-key': this.api_key },
      params,
    });

    return response.data;
  }
}
