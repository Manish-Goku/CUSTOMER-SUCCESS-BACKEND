import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { CreateTicketDto } from './dto/createTicket.dto.js';
import { UpdateTicketDto } from './dto/updateTicket.dto.js';
import { GetTicketsDto } from './dto/getTickets.dto.js';
import { EscalateTicketDto } from './dto/escalateTicket.dto.js';
import { AddTicketResponseDto } from './dto/addTicketResponse.dto.js';

export interface TicketRow {
  id: string;
  ticket_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  order_id: string | null;
  subject: string;
  description: string | null;
  category: string | null;
  subcategory: string | null;
  tags: string[] | null;
  priority: string | null;
  channel: string | null;
  status: string | null;
  sla_status: string | null;
  assigned_to: string | null;
  escalation_level: number | null;
  escalation_reason: string | null;
  follow_up_date: string | null;
  created_at: string | null;
  updated_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
}

export interface TicketResponseRow {
  id: string;
  ticket_id: string;
  sender_type: string | null;
  content: string;
  created_by: string | null;
  created_at: string | null;
}

export interface TicketTimelineRow {
  id: string;
  ticket_id: string;
  event_type: string;
  description: string | null;
  created_by: string | null;
  created_at: string | null;
}

export interface TicketWithRelations extends TicketRow {
  ticket_responses: TicketResponseRow[];
  ticket_timeline: TicketTimelineRow[];
}

export interface TicketStats {
  total: number;
  open: number;
  in_progress: number;
  pending_customer: number;
  escalated: number;
  resolved: number;
  closed: number;
  by_priority: { critical: number; high: number; medium: number; low: number };
}

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(private readonly supabase_service: SupabaseService) {}

  private async generate_ticket_id(): Promise<string> {
    const client = this.supabase_service.getClient();
    const { data, error } = await client
      .from('tickets')
      .select('ticket_id')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      this.logger.error('Failed to fetch last ticket_id', error);
    }

    let next_num = 1;
    if (data && data.length > 0) {
      const last_id = data[0].ticket_id;
      const num_part = parseInt(last_id.replace('TKT-', ''), 10);
      if (!isNaN(num_part)) next_num = num_part + 1;
    }

    return `TKT-${String(next_num).padStart(4, '0')}`;
  }

  private async add_timeline_event(
    ticket_uuid: string,
    event_type: string,
    description: string,
    created_by?: string,
  ): Promise<void> {
    const client = this.supabase_service.getClient();
    const { error } = await client.from('ticket_timeline').insert({
      ticket_id: ticket_uuid,
      event_type,
      description,
      created_by: created_by ?? null,
    });
    if (error) {
      this.logger.error('Failed to add timeline event', error);
    }
  }

  async create(dto: CreateTicketDto): Promise<TicketRow> {
    const client = this.supabase_service.getClient();
    const ticket_id = await this.generate_ticket_id();

    const insert_data: Record<string, unknown> = {
      ticket_id,
      subject: dto.subject,
      status: 'open',
      priority: dto.priority ?? 'medium',
      sla_status: 'on_track',
      escalation_level: 0,
    };

    if (dto.description !== undefined) insert_data.description = dto.description;
    if (dto.customer_name !== undefined) insert_data.customer_name = dto.customer_name;
    if (dto.customer_phone !== undefined) insert_data.customer_phone = dto.customer_phone;
    if (dto.customer_email !== undefined) insert_data.customer_email = dto.customer_email;
    if (dto.order_id !== undefined) insert_data.order_id = dto.order_id;
    if (dto.category !== undefined) insert_data.category = dto.category;
    if (dto.subcategory !== undefined) insert_data.subcategory = dto.subcategory;
    if (dto.tags !== undefined) insert_data.tags = dto.tags;
    if (dto.channel !== undefined) insert_data.channel = dto.channel;
    if (dto.assigned_to !== undefined) insert_data.assigned_to = dto.assigned_to;

    const { data, error } = await client
      .from('tickets')
      .insert(insert_data)
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to create ticket', error);
      throw new InternalServerErrorException('Failed to create ticket');
    }

    const ticket = data as TicketRow;
    await this.add_timeline_event(ticket.id, 'created', `Ticket ${ticket_id} created`, undefined);

    return ticket;
  }

  async find_all(dto: GetTicketsDto): Promise<{ data: TicketRow[]; total: number }> {
    const client = this.supabase_service.getClient();
    const page = dto.page || 1;
    const limit = dto.limit || 50;
    const offset = (page - 1) * limit;

    let query = client
      .from('tickets')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (dto.status) query = query.eq('status', dto.status);
    if (dto.priority) query = query.eq('priority', dto.priority);
    if (dto.category) query = query.eq('category', dto.category);
    if (dto.channel) query = query.eq('channel', dto.channel);
    if (dto.assigned_to) query = query.eq('assigned_to', dto.assigned_to);
    if (dto.search) {
      query = query.or(
        `subject.ilike.%${dto.search}%,ticket_id.ilike.%${dto.search}%,customer_name.ilike.%${dto.search}%`,
      );
    }

    const { data, error, count } = await query;

    if (error) {
      this.logger.error('Failed to fetch tickets', error);
      throw new InternalServerErrorException('Failed to fetch tickets');
    }

    return { data: (data || []) as TicketRow[], total: count || 0 };
  }

  async find_one(id: string): Promise<TicketWithRelations> {
    const client = this.supabase_service.getClient();

    const { data, error } = await client
      .from('tickets')
      .select('*, ticket_responses(*), ticket_timeline(*)')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Ticket ${id} not found`);
    }

    const ticket = data as TicketWithRelations;

    if (ticket.ticket_timeline) {
      ticket.ticket_timeline.sort(
        (a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime(),
      );
    }
    if (ticket.ticket_responses) {
      ticket.ticket_responses.sort(
        (a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime(),
      );
    }

    return ticket;
  }

  async update(id: string, dto: UpdateTicketDto): Promise<TicketRow> {
    const client = this.supabase_service.getClient();

    const update_data: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (dto.subject !== undefined) update_data.subject = dto.subject;
    if (dto.description !== undefined) update_data.description = dto.description;
    if (dto.customer_name !== undefined) update_data.customer_name = dto.customer_name;
    if (dto.customer_phone !== undefined) update_data.customer_phone = dto.customer_phone;
    if (dto.customer_email !== undefined) update_data.customer_email = dto.customer_email;
    if (dto.order_id !== undefined) update_data.order_id = dto.order_id;
    if (dto.category !== undefined) update_data.category = dto.category;
    if (dto.subcategory !== undefined) update_data.subcategory = dto.subcategory;
    if (dto.tags !== undefined) update_data.tags = dto.tags;
    if (dto.priority !== undefined) update_data.priority = dto.priority;
    if (dto.channel !== undefined) update_data.channel = dto.channel;
    if (dto.status !== undefined) {
      update_data.status = dto.status;
      if (dto.status === 'resolved') update_data.resolved_at = new Date().toISOString();
      if (dto.status === 'closed') update_data.closed_at = new Date().toISOString();
    }
    if (dto.sla_status !== undefined) update_data.sla_status = dto.sla_status;
    if (dto.assigned_to !== undefined) update_data.assigned_to = dto.assigned_to;
    if (dto.follow_up_date !== undefined) update_data.follow_up_date = dto.follow_up_date;

    const { data, error } = await client
      .from('tickets')
      .update(update_data)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      this.logger.error(`Failed to update ticket ${id}`, error);
      throw new NotFoundException(`Ticket ${id} not found`);
    }

    if (dto.status) {
      await this.add_timeline_event(id, 'status_change', `Status changed to ${dto.status}`);
    }

    return data as TicketRow;
  }

  async escalate(id: string, dto: EscalateTicketDto): Promise<TicketRow> {
    const client = this.supabase_service.getClient();

    // Get current ticket
    const { data: current, error: fetch_error } = await client
      .from('tickets')
      .select('escalation_level')
      .eq('id', id)
      .single();

    if (fetch_error || !current) {
      throw new NotFoundException(`Ticket ${id} not found`);
    }

    const new_level = Math.min((current.escalation_level || 0) + 1, 2);

    const { data, error } = await client
      .from('tickets')
      .update({
        status: 'escalated',
        escalation_level: new_level,
        escalation_reason: dto.reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      this.logger.error(`Failed to escalate ticket ${id}`, error);
      throw new InternalServerErrorException('Failed to escalate ticket');
    }

    await this.add_timeline_event(
      id,
      'escalation',
      `Escalated to level ${new_level}: ${dto.reason}`,
      dto.escalated_by,
    );

    return data as TicketRow;
  }

  async resolve(id: string): Promise<TicketRow> {
    const client = this.supabase_service.getClient();
    const now = new Date().toISOString();

    const { data, error } = await client
      .from('tickets')
      .update({
        status: 'resolved',
        resolved_at: now,
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Ticket ${id} not found`);
    }

    await this.add_timeline_event(id, 'resolved', 'Ticket resolved');

    return data as TicketRow;
  }

  async add_response(ticket_id: string, dto: AddTicketResponseDto): Promise<TicketResponseRow> {
    const client = this.supabase_service.getClient();

    // Verify ticket exists
    const { error: check_error } = await client
      .from('tickets')
      .select('id')
      .eq('id', ticket_id)
      .single();

    if (check_error) {
      throw new NotFoundException(`Ticket ${ticket_id} not found`);
    }

    const { data, error } = await client
      .from('ticket_responses')
      .insert({
        ticket_id,
        content: dto.content,
        sender_type: dto.sender_type ?? 'agent',
        created_by: dto.created_by ?? null,
      })
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to add ticket response', error);
      throw new InternalServerErrorException('Failed to add ticket response');
    }

    await this.add_timeline_event(
      ticket_id,
      'response',
      `Response added by ${dto.sender_type ?? 'agent'}`,
      dto.created_by,
    );

    return data as TicketResponseRow;
  }

  async get_stats(): Promise<TicketStats> {
    const client = this.supabase_service.getClient();

    const { count: total } = await client
      .from('tickets')
      .select('*', { count: 'exact', head: true });

    const status_counts = await Promise.all(
      ['open', 'in_progress', 'pending_customer', 'escalated', 'resolved', 'closed'].map(
        async (status) => {
          const { count } = await client
            .from('tickets')
            .select('*', { count: 'exact', head: true })
            .eq('status', status);
          return { status, count: count ?? 0 };
        },
      ),
    );

    const priority_counts = await Promise.all(
      ['critical', 'high', 'medium', 'low'].map(async (priority) => {
        const { count } = await client
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('priority', priority);
        return { priority, count: count ?? 0 };
      }),
    );

    const s = Object.fromEntries(status_counts.map((x) => [x.status, x.count]));
    const p = Object.fromEntries(priority_counts.map((x) => [x.priority, x.count]));

    return {
      total: total ?? 0,
      open: s['open'] ?? 0,
      in_progress: s['in_progress'] ?? 0,
      pending_customer: s['pending_customer'] ?? 0,
      escalated: s['escalated'] ?? 0,
      resolved: s['resolved'] ?? 0,
      closed: s['closed'] ?? 0,
      by_priority: {
        critical: p['critical'] ?? 0,
        high: p['high'] ?? 0,
        medium: p['medium'] ?? 0,
        low: p['low'] ?? 0,
      },
    };
  }
}
