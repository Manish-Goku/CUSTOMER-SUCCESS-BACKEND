import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { CreateTicketTemplateDto, UpdateTicketTemplateDto } from './dto/createTicketTemplate.dto.js';

export interface TicketTemplateRow {
  id: string;
  name: string;
  category: string | null;
  shortcut: string | null;
  subject: string | null;
  content: string | null;
  is_active: boolean | null;
  usage_count: number | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

@Injectable()
export class TicketTemplatesService {
  private readonly logger = new Logger(TicketTemplatesService.name);

  constructor(private readonly supabase_service: SupabaseService) {}

  async create(dto: CreateTicketTemplateDto): Promise<TicketTemplateRow> {
    const client = this.supabase_service.getClient();

    const insert_data: Record<string, unknown> = { name: dto.name };
    if (dto.category !== undefined) insert_data.category = dto.category;
    if (dto.shortcut !== undefined) insert_data.shortcut = dto.shortcut;
    if (dto.subject !== undefined) insert_data.subject = dto.subject;
    if (dto.content !== undefined) insert_data.content = dto.content;
    if (dto.is_active !== undefined) insert_data.is_active = dto.is_active;
    if (dto.created_by !== undefined) insert_data.created_by = dto.created_by;

    const { data, error } = await client
      .from('ticket_templates')
      .insert(insert_data)
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to create ticket template', error);
      throw new InternalServerErrorException('Failed to create ticket template');
    }

    return data as TicketTemplateRow;
  }

  async find_all(): Promise<TicketTemplateRow[]> {
    const client = this.supabase_service.getClient();

    const { data, error } = await client
      .from('ticket_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Failed to fetch ticket templates', error);
      throw new InternalServerErrorException('Failed to fetch ticket templates');
    }

    return (data || []) as TicketTemplateRow[];
  }

  async update(id: string, dto: UpdateTicketTemplateDto): Promise<TicketTemplateRow> {
    const client = this.supabase_service.getClient();

    const update_data: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.name !== undefined) update_data.name = dto.name;
    if (dto.category !== undefined) update_data.category = dto.category;
    if (dto.shortcut !== undefined) update_data.shortcut = dto.shortcut;
    if (dto.subject !== undefined) update_data.subject = dto.subject;
    if (dto.content !== undefined) update_data.content = dto.content;
    if (dto.is_active !== undefined) update_data.is_active = dto.is_active;

    const { data, error } = await client
      .from('ticket_templates')
      .update(update_data)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Ticket template ${id} not found`);
    }

    return data as TicketTemplateRow;
  }

  async remove(id: string): Promise<void> {
    const client = this.supabase_service.getClient();

    const { error } = await client
      .from('ticket_templates')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`Failed to delete ticket template ${id}`, error);
      throw new InternalServerErrorException('Failed to delete ticket template');
    }
  }

  async increment_usage(id: string): Promise<TicketTemplateRow> {
    const client = this.supabase_service.getClient();

    // Get current usage_count
    const { data: current, error: fetch_error } = await client
      .from('ticket_templates')
      .select('usage_count')
      .eq('id', id)
      .single();

    if (fetch_error || !current) {
      throw new NotFoundException(`Ticket template ${id} not found`);
    }

    const { data, error } = await client
      .from('ticket_templates')
      .update({ usage_count: (current.usage_count || 0) + 1 })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new InternalServerErrorException('Failed to increment usage count');
    }

    return data as TicketTemplateRow;
  }
}
