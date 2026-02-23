import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { CreateWorkflowDto } from './dto/createWorkflow.dto.js';
import { UpdateWorkflowDto } from './dto/updateWorkflow.dto.js';
import { GetWorkflowsDto } from './dto/getWorkflows.dto.js';
import { ExecuteWorkflowDto } from './dto/executeWorkflow.dto.js';

export interface WorkflowRow {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string | null;
  trigger_label: string | null;
  trigger_conditions: unknown;
  trigger_config: unknown;
  actions: unknown;
  is_active: boolean | null;
  created_by: string | null;
  created_by_name: string | null;
  execution_count: number | null;
  last_executed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface WorkflowLogRow {
  id: string;
  workflow_id: string;
  workflow_name: string | null;
  triggered_at: string | null;
  triggered_by: string | null;
  status: string | null;
  duration_ms: number | null;
  trigger_data: unknown;
  action_results: unknown;
  error: string | null;
  created_at: string | null;
}

@Injectable()
export class WorkflowsService {
  private readonly logger = new Logger(WorkflowsService.name);

  constructor(private readonly supabase_service: SupabaseService) {}

  async create(dto: CreateWorkflowDto): Promise<WorkflowRow> {
    const client = this.supabase_service.getClient();

    const insert_data: Record<string, unknown> = { name: dto.name };
    if (dto.description !== undefined) insert_data.description = dto.description;
    if (dto.trigger_type !== undefined) insert_data.trigger_type = dto.trigger_type;
    if (dto.trigger_label !== undefined) insert_data.trigger_label = dto.trigger_label;
    if (dto.trigger_conditions !== undefined) insert_data.trigger_conditions = dto.trigger_conditions;
    if (dto.trigger_config !== undefined) insert_data.trigger_config = dto.trigger_config;
    if (dto.actions !== undefined) insert_data.actions = dto.actions;
    if (dto.is_active !== undefined) insert_data.is_active = dto.is_active;
    if (dto.created_by !== undefined) insert_data.created_by = dto.created_by;
    if (dto.created_by_name !== undefined) insert_data.created_by_name = dto.created_by_name;

    const { data, error } = await client
      .from('workflows')
      .insert(insert_data)
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to create workflow', error);
      throw new InternalServerErrorException('Failed to create workflow');
    }

    return data as WorkflowRow;
  }

  async find_all(dto: GetWorkflowsDto): Promise<{ data: WorkflowRow[]; total: number }> {
    const client = this.supabase_service.getClient();
    const page = dto.page || 1;
    const limit = dto.limit || 50;
    const offset = (page - 1) * limit;

    let query = client
      .from('workflows')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (dto.trigger_type) query = query.eq('trigger_type', dto.trigger_type);
    if (dto.is_active !== undefined) query = query.eq('is_active', dto.is_active);
    if (dto.search) {
      query = query.or(`name.ilike.%${dto.search}%,description.ilike.%${dto.search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      this.logger.error('Failed to fetch workflows', error);
      throw new InternalServerErrorException('Failed to fetch workflows');
    }

    return { data: (data || []) as WorkflowRow[], total: count || 0 };
  }

  async find_one(id: string): Promise<WorkflowRow> {
    const client = this.supabase_service.getClient();

    const { data, error } = await client
      .from('workflows')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Workflow ${id} not found`);
    }

    return data as WorkflowRow;
  }

  async update(id: string, dto: UpdateWorkflowDto): Promise<WorkflowRow> {
    const client = this.supabase_service.getClient();

    const update_data: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.name !== undefined) update_data.name = dto.name;
    if (dto.description !== undefined) update_data.description = dto.description;
    if (dto.trigger_type !== undefined) update_data.trigger_type = dto.trigger_type;
    if (dto.trigger_label !== undefined) update_data.trigger_label = dto.trigger_label;
    if (dto.trigger_conditions !== undefined) update_data.trigger_conditions = dto.trigger_conditions;
    if (dto.trigger_config !== undefined) update_data.trigger_config = dto.trigger_config;
    if (dto.actions !== undefined) update_data.actions = dto.actions;
    if (dto.is_active !== undefined) update_data.is_active = dto.is_active;

    const { data, error } = await client
      .from('workflows')
      .update(update_data)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Workflow ${id} not found`);
    }

    return data as WorkflowRow;
  }

  async remove(id: string): Promise<void> {
    const client = this.supabase_service.getClient();
    const { error } = await client.from('workflows').delete().eq('id', id);
    if (error) {
      this.logger.error(`Failed to delete workflow ${id}`, error);
      throw new InternalServerErrorException('Failed to delete workflow');
    }
  }

  async toggle(id: string): Promise<WorkflowRow> {
    const client = this.supabase_service.getClient();

    const { data: current, error: fetch_error } = await client
      .from('workflows')
      .select('is_active')
      .eq('id', id)
      .single();

    if (fetch_error || !current) {
      throw new NotFoundException(`Workflow ${id} not found`);
    }

    const { data, error } = await client
      .from('workflows')
      .update({ is_active: !current.is_active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new InternalServerErrorException('Failed to toggle workflow');
    }

    return data as WorkflowRow;
  }

  async duplicate(id: string): Promise<WorkflowRow> {
    const client = this.supabase_service.getClient();
    const original = await this.find_one(id);

    const { data, error } = await client
      .from('workflows')
      .insert({
        name: `${original.name} (Copy)`,
        description: original.description,
        trigger_type: original.trigger_type,
        trigger_label: original.trigger_label,
        trigger_conditions: original.trigger_conditions,
        trigger_config: original.trigger_config,
        actions: original.actions,
        is_active: false,
        created_by: original.created_by,
        created_by_name: original.created_by_name,
      })
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to duplicate workflow', error);
      throw new InternalServerErrorException('Failed to duplicate workflow');
    }

    return data as WorkflowRow;
  }

  async execute(id: string, dto: ExecuteWorkflowDto): Promise<WorkflowLogRow> {
    const client = this.supabase_service.getClient();
    const workflow = await this.find_one(id);
    const start = Date.now();

    // Create log entry
    const { data: log, error: log_error } = await client
      .from('workflow_execution_logs')
      .insert({
        workflow_id: id,
        workflow_name: workflow.name,
        triggered_by: dto.triggered_by ?? null,
        trigger_data: dto.trigger_data ?? {},
        status: 'running',
      })
      .select()
      .single();

    if (log_error || !log) {
      this.logger.error('Failed to create execution log', log_error);
      throw new InternalServerErrorException('Failed to create execution log');
    }

    // Simulate execution (mark success)
    const duration_ms = Date.now() - start;

    const { data: updated_log, error: update_error } = await client
      .from('workflow_execution_logs')
      .update({
        status: 'success',
        duration_ms,
        action_results: [{ step: 'execution', result: 'simulated_success' }],
      })
      .eq('id', log.id)
      .select()
      .single();

    if (update_error) {
      this.logger.error('Failed to update execution log', update_error);
    }

    // Update workflow execution count
    await client
      .from('workflows')
      .update({
        execution_count: (workflow.execution_count || 0) + 1,
        last_executed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    return (updated_log || log) as WorkflowLogRow;
  }

  async get_logs(workflow_id: string): Promise<WorkflowLogRow[]> {
    const client = this.supabase_service.getClient();

    const { data, error } = await client
      .from('workflow_execution_logs')
      .select('*')
      .eq('workflow_id', workflow_id)
      .order('triggered_at', { ascending: false });

    if (error) {
      this.logger.error('Failed to fetch workflow logs', error);
      throw new InternalServerErrorException('Failed to fetch workflow logs');
    }

    return (data || []) as WorkflowLogRow[];
  }

  async get_all_logs(): Promise<WorkflowLogRow[]> {
    const client = this.supabase_service.getClient();

    const { data, error } = await client
      .from('workflow_execution_logs')
      .select('*')
      .order('triggered_at', { ascending: false })
      .limit(100);

    if (error) {
      this.logger.error('Failed to fetch all workflow logs', error);
      throw new InternalServerErrorException('Failed to fetch workflow logs');
    }

    return (data || []) as WorkflowLogRow[];
  }
}
