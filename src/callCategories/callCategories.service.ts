import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import {
  CreateCallCategoryDto,
  UpdateCallCategoryDto,
} from './dto/createCallCategory.dto.js';
import {
  GetCallCategoriesDto,
  CallCategoryResponseDto,
  CallCategoryTreeNode,
} from './dto/getCallCategories.dto.js';

@Injectable()
export class CallCategoriesService {
  private readonly logger = new Logger(CallCategoriesService.name);

  constructor(private readonly supabase_service: SupabaseService) {}

  async create(dto: CreateCallCategoryDto): Promise<CallCategoryResponseDto> {
    const client = this.supabase_service.getClient();

    if (dto.parent_category_id) {
      const { data: parent, error: parent_error } = await client
        .from('call_categories')
        .select('id')
        .eq('id', dto.parent_category_id)
        .single();

      if (parent_error || !parent) {
        throw new NotFoundException(
          `Parent category ${dto.parent_category_id} not found`,
        );
      }
    }

    const { data, error } = await client
      .from('call_categories')
      .insert({
        department: dto.department,
        category: dto.category,
        sub_category: dto.sub_category ?? null,
        sla_hours: dto.sla_hours ?? 24,
        requires_attachment: dto.requires_attachment ?? false,
        requires_description: dto.requires_description ?? true,
        parent_category_id: dto.parent_category_id ?? null,
        display_order: dto.display_order ?? 0,
      })
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to create call category', error);
      throw new Error('Failed to create call category');
    }

    return data as CallCategoryResponseDto;
  }

  async find_all(
    dto: GetCallCategoriesDto,
  ): Promise<{ data: CallCategoryTreeNode[]; total: number }> {
    const client = this.supabase_service.getClient();
    const page = dto.page || 1;
    const limit = dto.limit || 50;
    const offset = (page - 1) * limit;

    let query = client
      .from('call_categories')
      .select('*', { count: 'exact' })
      .order('display_order', { ascending: true })
      .order('category', { ascending: true });

    if (dto.department) query = query.eq('department', dto.department);
    if (dto.is_active !== undefined) query = query.eq('is_active', dto.is_active);
    if (dto.search) {
      query = query.or(
        `category.ilike.%${dto.search}%,sub_category.ilike.%${dto.search}%`,
      );
    }

    const { data: all_data, error: count_error, count } = await query;

    if (count_error) {
      this.logger.error('Failed to fetch call categories', count_error);
      throw new Error('Failed to fetch call categories');
    }

    const all_categories = (all_data || []) as CallCategoryResponseDto[];
    const tree = this.build_tree(all_categories);

    const paginated = tree.slice(offset, offset + limit);

    return {
      data: paginated,
      total: count || 0,
    };
  }

  async find_one(id: string): Promise<CallCategoryResponseDto> {
    const { data, error } = await this.supabase_service
      .getClient()
      .from('call_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Call category ${id} not found`);
    }

    return data as CallCategoryResponseDto;
  }

  async update(
    id: string,
    dto: UpdateCallCategoryDto,
  ): Promise<CallCategoryResponseDto> {
    const client = this.supabase_service.getClient();

    await this.find_one(id);

    if (dto.parent_category_id) {
      if (dto.parent_category_id === id) {
        throw new Error('A category cannot be its own parent');
      }

      const { data: parent, error: parent_error } = await client
        .from('call_categories')
        .select('id')
        .eq('id', dto.parent_category_id)
        .single();

      if (parent_error || !parent) {
        throw new NotFoundException(
          `Parent category ${dto.parent_category_id} not found`,
        );
      }
    }

    const update_data: Record<string, unknown> = {};

    if (dto.department !== undefined) update_data.department = dto.department;
    if (dto.category !== undefined) update_data.category = dto.category;
    if (dto.sub_category !== undefined) update_data.sub_category = dto.sub_category;
    if (dto.sla_hours !== undefined) update_data.sla_hours = dto.sla_hours;
    if (dto.requires_attachment !== undefined)
      update_data.requires_attachment = dto.requires_attachment;
    if (dto.requires_description !== undefined)
      update_data.requires_description = dto.requires_description;
    if (dto.parent_category_id !== undefined)
      update_data.parent_category_id = dto.parent_category_id;
    if (dto.display_order !== undefined) update_data.display_order = dto.display_order;
    if (dto.is_active !== undefined) update_data.is_active = dto.is_active;

    const { data, error } = await client
      .from('call_categories')
      .update(update_data)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to update call category', error);
      throw new Error('Failed to update call category');
    }

    return data as CallCategoryResponseDto;
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    await this.find_one(id);

    const { error } = await this.supabase_service
      .getClient()
      .from('call_categories')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      this.logger.error('Failed to soft-delete call category', error);
      throw new Error('Failed to soft-delete call category');
    }

    return { success: true, message: 'Call category deactivated' };
  }

  async find_by_department(department: string): Promise<CallCategoryTreeNode[]> {
    const client = this.supabase_service.getClient();

    const { data, error } = await client
      .from('call_categories')
      .select('*')
      .eq('department', department)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('category', { ascending: true });

    if (error) {
      this.logger.error(
        `Failed to fetch categories for department ${department}`,
        error,
      );
      throw new Error('Failed to fetch categories by department');
    }

    const categories = (data || []) as CallCategoryResponseDto[];
    return this.build_tree(categories);
  }

  private build_tree(categories: CallCategoryResponseDto[]): CallCategoryTreeNode[] {
    const node_map = new Map<string, CallCategoryTreeNode>();
    const roots: CallCategoryTreeNode[] = [];

    for (const cat of categories) {
      node_map.set(cat.id, { ...cat, children: [] });
    }

    for (const cat of categories) {
      const node = node_map.get(cat.id)!;

      if (cat.parent_category_id && node_map.has(cat.parent_category_id)) {
        node_map.get(cat.parent_category_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
