import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { CreateTicketCategoryDto, UpdateTicketCategoryDto } from './dto/createTicketCategory.dto.js';

export interface TicketCategoryRow {
  id: string;
  name: string;
  subcategories: string[] | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

@Injectable()
export class TicketCategoriesService {
  private readonly logger = new Logger(TicketCategoriesService.name);

  constructor(private readonly supabase_service: SupabaseService) {}

  async create(dto: CreateTicketCategoryDto): Promise<TicketCategoryRow> {
    const client = this.supabase_service.getClient();

    const insert_data: Record<string, unknown> = { name: dto.name };
    if (dto.subcategories !== undefined) insert_data.subcategories = dto.subcategories;
    if (dto.is_active !== undefined) insert_data.is_active = dto.is_active;

    const { data, error } = await client
      .from('ticket_categories')
      .insert(insert_data)
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to create ticket category', error);
      throw new InternalServerErrorException('Failed to create ticket category');
    }

    return data as TicketCategoryRow;
  }

  async find_all(): Promise<TicketCategoryRow[]> {
    const client = this.supabase_service.getClient();

    const { data, error } = await client
      .from('ticket_categories')
      .select('*')
      .order('name');

    if (error) {
      this.logger.error('Failed to fetch ticket categories', error);
      throw new InternalServerErrorException('Failed to fetch ticket categories');
    }

    return (data || []) as TicketCategoryRow[];
  }

  async update(id: string, dto: UpdateTicketCategoryDto): Promise<TicketCategoryRow> {
    const client = this.supabase_service.getClient();

    const update_data: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.name !== undefined) update_data.name = dto.name;
    if (dto.subcategories !== undefined) update_data.subcategories = dto.subcategories;
    if (dto.is_active !== undefined) update_data.is_active = dto.is_active;

    const { data, error } = await client
      .from('ticket_categories')
      .update(update_data)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Ticket category ${id} not found`);
    }

    return data as TicketCategoryRow;
  }

  async remove(id: string): Promise<void> {
    const client = this.supabase_service.getClient();

    const { error } = await client
      .from('ticket_categories')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`Failed to delete ticket category ${id}`, error);
      throw new InternalServerErrorException('Failed to delete ticket category');
    }
  }
}
