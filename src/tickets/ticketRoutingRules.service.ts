import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { IsString, IsOptional, IsNumber, IsBoolean, IsObject, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SupabaseService } from '../supabase/supabase.service.js';

export interface TicketRoutingRuleRow {
  id: string;
  name: string;
  description: string | null;
  priority: number | null;
  is_active: boolean | null;
  conditions: unknown;
  action: unknown;
  created_at: string | null;
  updated_at: string | null;
}

export class CreateTicketRoutingRuleDto {
  @ApiProperty() @IsString() @MinLength(1) name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() priority?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_active?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsObject() conditions?: unknown;
  @ApiPropertyOptional() @IsOptional() @IsObject() action?: unknown;
}

export class UpdateTicketRoutingRuleDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() priority?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() is_active?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsObject() conditions?: unknown;
  @ApiPropertyOptional() @IsOptional() @IsObject() action?: unknown;
}

@Injectable()
export class TicketRoutingRulesService {
  private readonly logger = new Logger(TicketRoutingRulesService.name);

  constructor(private readonly supabase_service: SupabaseService) {}

  async create(dto: CreateTicketRoutingRuleDto): Promise<TicketRoutingRuleRow> {
    const client = this.supabase_service.getClient();

    const insert_data: Record<string, unknown> = { name: dto.name };
    if (dto.description !== undefined) insert_data.description = dto.description;
    if (dto.priority !== undefined) insert_data.priority = dto.priority;
    if (dto.is_active !== undefined) insert_data.is_active = dto.is_active;
    if (dto.conditions !== undefined) insert_data.conditions = dto.conditions;
    if (dto.action !== undefined) insert_data.action = dto.action;

    const { data, error } = await client
      .from('ticket_routing_rules')
      .insert(insert_data)
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to create routing rule', error);
      throw new InternalServerErrorException('Failed to create routing rule');
    }

    return data as TicketRoutingRuleRow;
  }

  async find_all(): Promise<TicketRoutingRuleRow[]> {
    const client = this.supabase_service.getClient();

    const { data, error } = await client
      .from('ticket_routing_rules')
      .select('*')
      .order('priority', { ascending: true });

    if (error) {
      this.logger.error('Failed to fetch routing rules', error);
      throw new InternalServerErrorException('Failed to fetch routing rules');
    }

    return (data || []) as TicketRoutingRuleRow[];
  }

  async update(id: string, dto: UpdateTicketRoutingRuleDto): Promise<TicketRoutingRuleRow> {
    const client = this.supabase_service.getClient();

    const update_data: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.name !== undefined) update_data.name = dto.name;
    if (dto.description !== undefined) update_data.description = dto.description;
    if (dto.priority !== undefined) update_data.priority = dto.priority;
    if (dto.is_active !== undefined) update_data.is_active = dto.is_active;
    if (dto.conditions !== undefined) update_data.conditions = dto.conditions;
    if (dto.action !== undefined) update_data.action = dto.action;

    const { data, error } = await client
      .from('ticket_routing_rules')
      .update(update_data)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Routing rule ${id} not found`);
    }

    return data as TicketRoutingRuleRow;
  }

  async remove(id: string): Promise<void> {
    const client = this.supabase_service.getClient();

    const { error } = await client
      .from('ticket_routing_rules')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error(`Failed to delete routing rule ${id}`, error);
      throw new InternalServerErrorException('Failed to delete routing rule');
    }
  }

  async toggle(id: string): Promise<TicketRoutingRuleRow> {
    const client = this.supabase_service.getClient();

    const { data: current, error: fetch_error } = await client
      .from('ticket_routing_rules')
      .select('is_active')
      .eq('id', id)
      .single();

    if (fetch_error || !current) {
      throw new NotFoundException(`Routing rule ${id} not found`);
    }

    const { data, error } = await client
      .from('ticket_routing_rules')
      .update({
        is_active: !current.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new InternalServerErrorException('Failed to toggle routing rule');
    }

    return data as TicketRoutingRuleRow;
  }
}
