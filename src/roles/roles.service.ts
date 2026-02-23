import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { CreateRoleDto, UpdateRoleDto } from './dto/createRole.dto.js';
import { AssignRoleDto } from './dto/assignRole.dto.js';
import { UpdateModuleAccessDto } from './dto/updateModuleAccess.dto.js';

export interface RoleRow {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModuleRow {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModuleRoleAccessRow {
  id: string;
  module_id: string;
  role_id: string;
  access_level: string;
  created_at: string;
  modules: ModuleRow;
}

export interface UserRoleAccessRow {
  id: string;
  user_id: string;
  role_id: string;
  created_at: string;
  agents: { id: string; name: string; email: string };
  roles: { id: string; name: string };
}

export interface UserAccessResult {
  user_id: string;
  role: { id: string; name: string; description: string | null } | null;
  modules: { module_id: string; module_name: string; access_level: string }[];
}

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(private readonly supabase_service: SupabaseService) {}

  // ─── Roles CRUD ────────────────────────────────────────────────

  async list_roles(): Promise<RoleRow[]> {
    const { data, error } = await this.supabase_service
      .getClient()
      .from('roles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error('Failed to list roles', error);
      throw new InternalServerErrorException('Failed to list roles');
    }

    return (data ?? []) as RoleRow[];
  }

  async create_role(dto: CreateRoleDto): Promise<RoleRow> {
    const client = this.supabase_service.getClient();

    const { data: existing } = await client
      .from('roles')
      .select('id')
      .eq('name', dto.name)
      .single();

    if (existing) {
      throw new ConflictException(`Role "${dto.name}" already exists`);
    }

    const { data, error } = await client
      .from('roles')
      .insert({
        name: dto.name,
        description: dto.description ?? null,
      })
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to create role', error);
      throw new InternalServerErrorException('Failed to create role');
    }

    return data as RoleRow;
  }

  async update_role(id: string, dto: UpdateRoleDto): Promise<RoleRow> {
    const client = this.supabase_service.getClient();

    // Verify role exists
    const { data: existing, error: fetch_error } = await client
      .from('roles')
      .select('id')
      .eq('id', id)
      .single();

    if (fetch_error || !existing) {
      throw new NotFoundException(`Role ${id} not found`);
    }

    // Check name uniqueness if name is being updated
    if (dto.name) {
      const { data: dup } = await client
        .from('roles')
        .select('id')
        .eq('name', dto.name)
        .neq('id', id)
        .single();

      if (dup) {
        throw new ConflictException(`Role "${dto.name}" already exists`);
      }
    }

    const update_data: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (dto.name !== undefined) update_data.name = dto.name;
    if (dto.description !== undefined) update_data.description = dto.description;

    const { data, error } = await client
      .from('roles')
      .update(update_data)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to update role', error);
      throw new InternalServerErrorException('Failed to update role');
    }

    return data as RoleRow;
  }

  async delete_role(id: string): Promise<{ success: boolean; message: string }> {
    const client = this.supabase_service.getClient();

    const { data: existing, error: fetch_error } = await client
      .from('roles')
      .select('id')
      .eq('id', id)
      .single();

    if (fetch_error || !existing) {
      throw new NotFoundException(`Role ${id} not found`);
    }

    // Delete related module_role_access and user_role_access entries first
    const { error: mra_error } = await client
      .from('module_role_access')
      .delete()
      .eq('role_id', id);

    if (mra_error) {
      this.logger.error('Failed to delete module_role_access for role', mra_error);
      throw new InternalServerErrorException('Failed to delete role module access');
    }

    const { error: ura_error } = await client
      .from('user_role_access')
      .delete()
      .eq('role_id', id);

    if (ura_error) {
      this.logger.error('Failed to delete user_role_access for role', ura_error);
      throw new InternalServerErrorException('Failed to delete role user assignments');
    }

    const { error } = await client
      .from('roles')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error('Failed to delete role', error);
      throw new InternalServerErrorException('Failed to delete role');
    }

    return { success: true, message: 'Role deleted' };
  }

  // ─── Modules ───────────────────────────────────────────────────

  async list_modules(): Promise<ModuleRow[]> {
    const { data, error } = await this.supabase_service
      .getClient()
      .from('modules')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      this.logger.error('Failed to list modules', error);
      throw new InternalServerErrorException('Failed to list modules');
    }

    return (data ?? []) as ModuleRow[];
  }

  async get_role_modules(
    role_id: string,
  ): Promise<{ module_id: string; module_name: string; access_level: string }[]> {
    const client = this.supabase_service.getClient();

    // Verify role exists
    const { data: role, error: role_error } = await client
      .from('roles')
      .select('id')
      .eq('id', role_id)
      .single();

    if (role_error || !role) {
      throw new NotFoundException(`Role ${role_id} not found`);
    }

    const { data, error } = await client
      .from('module_role_access')
      .select('id, module_id, role_id, access_level, created_at, modules(id, name, description, created_at, updated_at)')
      .eq('role_id', role_id);

    if (error) {
      this.logger.error('Failed to get role modules', error);
      throw new InternalServerErrorException('Failed to get role modules');
    }

    return ((data ?? []) as unknown as ModuleRoleAccessRow[]).map((row) => ({
      module_id: row.module_id,
      module_name: row.modules.name,
      access_level: row.access_level,
    }));
  }

  async set_role_modules(
    role_id: string,
    dto: UpdateModuleAccessDto,
  ): Promise<{ module_id: string; module_name: string; access_level: string }[]> {
    const client = this.supabase_service.getClient();

    // Verify role exists
    const { data: role, error: role_error } = await client
      .from('roles')
      .select('id')
      .eq('id', role_id)
      .single();

    if (role_error || !role) {
      throw new NotFoundException(`Role ${role_id} not found`);
    }

    // Delete existing module access for this role
    const { error: delete_error } = await client
      .from('module_role_access')
      .delete()
      .eq('role_id', role_id);

    if (delete_error) {
      this.logger.error('Failed to clear existing module access', delete_error);
      throw new InternalServerErrorException('Failed to update module access');
    }

    // Insert new module access entries
    if (dto.modules.length > 0) {
      const insert_rows = dto.modules.map((m) => ({
        module_id: m.module_id,
        role_id,
        access_level: m.access_level ?? 'read',
      }));

      const { error: insert_error } = await client
        .from('module_role_access')
        .insert(insert_rows);

      if (insert_error) {
        this.logger.error('Failed to insert module access', insert_error);
        throw new InternalServerErrorException('Failed to update module access');
      }
    }

    // Return the updated list
    return this.get_role_modules(role_id);
  }

  // ─── User Role Assignments ────────────────────────────────────

  async list_user_roles(): Promise<UserRoleAccessRow[]> {
    const { data, error } = await this.supabase_service
      .getClient()
      .from('user_role_access')
      .select('id, user_id, role_id, created_at, agents(id, name, email), roles(id, name)')
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Failed to list user role assignments', error);
      throw new InternalServerErrorException('Failed to list user role assignments');
    }

    return (data ?? []) as unknown as UserRoleAccessRow[];
  }

  async assign_role(dto: AssignRoleDto): Promise<UserRoleAccessRow> {
    const client = this.supabase_service.getClient();

    // Check for duplicate assignment
    const { data: existing } = await client
      .from('user_role_access')
      .select('id')
      .eq('user_id', dto.user_id)
      .eq('role_id', dto.role_id)
      .single();

    if (existing) {
      throw new ConflictException('User already has this role assigned');
    }

    const { data, error } = await client
      .from('user_role_access')
      .insert({
        user_id: dto.user_id,
        role_id: dto.role_id,
      })
      .select('id, user_id, role_id, created_at, agents(id, name, email), roles(id, name)')
      .single();

    if (error || !data) {
      this.logger.error('Failed to assign role', error);
      throw new InternalServerErrorException('Failed to assign role');
    }

    return data as unknown as UserRoleAccessRow;
  }

  async remove_user_role(id: string): Promise<{ success: boolean; message: string }> {
    const client = this.supabase_service.getClient();

    const { data: existing, error: fetch_error } = await client
      .from('user_role_access')
      .select('id')
      .eq('id', id)
      .single();

    if (fetch_error || !existing) {
      throw new NotFoundException(`User role assignment ${id} not found`);
    }

    const { error } = await client
      .from('user_role_access')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error('Failed to remove user role assignment', error);
      throw new InternalServerErrorException('Failed to remove user role assignment');
    }

    return { success: true, message: 'User role assignment removed' };
  }

  async get_user_access(user_id: string): Promise<UserAccessResult> {
    const client = this.supabase_service.getClient();

    // Get user's role assignment
    const { data: user_role, error: role_error } = await client
      .from('user_role_access')
      .select('id, user_id, role_id, created_at, roles(id, name, description)')
      .eq('user_id', user_id)
      .limit(1)
      .single();

    if (role_error || !user_role) {
      // User has no role assigned — return empty access
      return {
        user_id,
        role: null,
        modules: [],
      };
    }

    const typed_role = user_role as unknown as {
      roles: { id: string; name: string; description: string | null };
      role_id: string;
    };

    // Get modules accessible by this role
    const { data: module_access, error: module_error } = await client
      .from('module_role_access')
      .select('module_id, access_level, modules(id, name)')
      .eq('role_id', typed_role.role_id);

    if (module_error) {
      this.logger.error('Failed to get user module access', module_error);
      throw new InternalServerErrorException('Failed to get user access');
    }

    const typed_modules = (module_access ?? []) as unknown as {
      module_id: string;
      access_level: string;
      modules: { id: string; name: string };
    }[];

    return {
      user_id,
      role: typed_role.roles,
      modules: typed_modules.map((m) => ({
        module_id: m.module_id,
        module_name: m.modules.name,
        access_level: m.access_level,
      })),
    };
  }
}
