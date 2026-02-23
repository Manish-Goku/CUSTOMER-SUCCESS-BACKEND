import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import {
  CreateChatTemplateDto,
  UpdateChatTemplateDto,
  GetChatTemplatesDto,
  ChatTemplateResponseDto,
} from './dto/chatTemplate.dto.js';

@Injectable()
export class ChatTemplatesService {
  private readonly logger = new Logger(ChatTemplatesService.name);

  constructor(private readonly supabase_service: SupabaseService) {}

  async create(dto: CreateChatTemplateDto): Promise<ChatTemplateResponseDto> {
    const client = this.supabase_service.getClient();

    const { data: existing } = await client
      .from('chat_templates')
      .select('id')
      .eq('trigger', dto.trigger)
      .single();

    if (existing) {
      throw new ConflictException(`Trigger "${dto.trigger}" already exists`);
    }

    const { data, error } = await client
      .from('chat_templates')
      .insert({
        trigger: dto.trigger,
        title: dto.title,
        content: dto.content,
        category: dto.category || 'general',
        channel: dto.channel || 'all',
      })
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to create chat template', error);
      throw new Error('Failed to create chat template');
    }

    return data as ChatTemplateResponseDto;
  }

  async find_all(
    dto: GetChatTemplatesDto,
  ): Promise<{ data: ChatTemplateResponseDto[]; total: number }> {
    const client = this.supabase_service.getClient();
    const page = dto.page || 1;
    const limit = dto.limit || 50;
    const offset = (page - 1) * limit;

    let query = client
      .from('chat_templates')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (dto.category) query = query.eq('category', dto.category);
    if (dto.channel) query = query.eq('channel', dto.channel);
    if (dto.search) {
      query = query.or(
        `trigger.ilike.%${dto.search}%,title.ilike.%${dto.search}%,content.ilike.%${dto.search}%`,
      );
    }

    const { data, error, count } = await query;

    if (error) {
      this.logger.error('Failed to fetch chat templates', error);
      throw new Error('Failed to fetch chat templates');
    }

    return {
      data: (data || []) as ChatTemplateResponseDto[],
      total: count || 0,
    };
  }

  async find_one(id: string): Promise<ChatTemplateResponseDto> {
    const { data, error } = await this.supabase_service
      .getClient()
      .from('chat_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Chat template ${id} not found`);
    }

    return data as ChatTemplateResponseDto;
  }

  async update(
    id: string,
    dto: UpdateChatTemplateDto,
  ): Promise<ChatTemplateResponseDto> {
    const client = this.supabase_service.getClient();

    await this.find_one(id);

    if (dto.trigger) {
      const { data: dup } = await client
        .from('chat_templates')
        .select('id')
        .eq('trigger', dto.trigger)
        .neq('id', id)
        .single();

      if (dup) {
        throw new ConflictException(`Trigger "${dto.trigger}" already exists`);
      }
    }

    const update_data: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.trigger !== undefined) update_data.trigger = dto.trigger;
    if (dto.title !== undefined) update_data.title = dto.title;
    if (dto.content !== undefined) update_data.content = dto.content;
    if (dto.category !== undefined) update_data.category = dto.category;
    if (dto.channel !== undefined) update_data.channel = dto.channel;
    if (dto.is_active !== undefined) update_data.is_active = dto.is_active;

    const { data, error } = await client
      .from('chat_templates')
      .update(update_data)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to update chat template', error);
      throw new Error('Failed to update chat template');
    }

    return data as ChatTemplateResponseDto;
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    await this.find_one(id);

    const { error } = await this.supabase_service
      .getClient()
      .from('chat_templates')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error('Failed to delete chat template', error);
      throw new Error('Failed to delete chat template');
    }

    return { success: true, message: 'Chat template deleted' };
  }

  async duplicate(id: string): Promise<ChatTemplateResponseDto> {
    const original = await this.find_one(id);

    const { data, error } = await this.supabase_service
      .getClient()
      .from('chat_templates')
      .insert({
        trigger: `${original.trigger}_copy`,
        title: `${original.title} (Copy)`,
        content: original.content,
        category: original.category,
        channel: original.channel,
        is_active: true,
        usage_count: 0,
      })
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to duplicate chat template', error);
      throw new Error('Failed to duplicate chat template');
    }

    return data as ChatTemplateResponseDto;
  }

  async increment_usage(id: string): Promise<void> {
    const client = this.supabase_service.getClient();

    const { error } = await client.rpc('increment_chat_template_usage', {
      template_id: id,
    });

    if (error) {
      // Fallback: manual increment
      const template = await this.find_one(id);
      await client
        .from('chat_templates')
        .update({ usage_count: template.usage_count + 1 })
        .eq('id', id);
    }
  }
}
