import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { CreateSurveyTemplateDto, UpdateSurveyTemplateDto } from './dto/createSurveyTemplate.dto.js';
import { CreateSurveyQuestionDto, UpdateSurveyQuestionDto } from './dto/createSurveyQuestion.dto.js';

export interface SurveyTemplateRow {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  is_active: boolean | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SurveyQuestionRow {
  id: string;
  template_id: string;
  question_text: string;
  question_type: string | null;
  options: string[] | null;
  is_required: boolean | null;
  is_skippable: boolean | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SurveyTemplateWithQuestions extends SurveyTemplateRow {
  survey_questions: SurveyQuestionRow[];
}

@Injectable()
export class SurveyTemplatesService {
  private readonly logger = new Logger(SurveyTemplatesService.name);

  constructor(private readonly supabase_service: SupabaseService) {}

  async create(dto: CreateSurveyTemplateDto): Promise<SurveyTemplateRow> {
    const client = this.supabase_service.getClient();

    const insert_data: Record<string, unknown> = { name: dto.name };
    if (dto.description !== undefined) insert_data.description = dto.description;
    if (dto.category !== undefined) insert_data.category = dto.category;
    if (dto.is_active !== undefined) insert_data.is_active = dto.is_active;
    if (dto.created_by !== undefined) insert_data.created_by = dto.created_by;

    const { data, error } = await client
      .from('survey_templates')
      .insert(insert_data)
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to create survey template', error);
      throw new InternalServerErrorException('Failed to create survey template');
    }

    return data as SurveyTemplateRow;
  }

  async find_all(): Promise<SurveyTemplateRow[]> {
    const client = this.supabase_service.getClient();

    const { data, error } = await client
      .from('survey_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Failed to fetch survey templates', error);
      throw new InternalServerErrorException('Failed to fetch survey templates');
    }

    return (data || []) as SurveyTemplateRow[];
  }

  async find_one(id: string): Promise<SurveyTemplateWithQuestions> {
    const client = this.supabase_service.getClient();

    const { data, error } = await client
      .from('survey_templates')
      .select('*, survey_questions(*)')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Survey template ${id} not found`);
    }

    const template = data as SurveyTemplateWithQuestions;
    if (template.survey_questions) {
      template.survey_questions.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }

    return template;
  }

  async update(id: string, dto: UpdateSurveyTemplateDto): Promise<SurveyTemplateRow> {
    const client = this.supabase_service.getClient();

    const update_data: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.name !== undefined) update_data.name = dto.name;
    if (dto.description !== undefined) update_data.description = dto.description;
    if (dto.category !== undefined) update_data.category = dto.category;
    if (dto.is_active !== undefined) update_data.is_active = dto.is_active;

    const { data, error } = await client
      .from('survey_templates')
      .update(update_data)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Survey template ${id} not found`);
    }

    return data as SurveyTemplateRow;
  }

  async remove(id: string): Promise<void> {
    const client = this.supabase_service.getClient();
    const { error } = await client.from('survey_templates').delete().eq('id', id);
    if (error) {
      this.logger.error(`Failed to delete survey template ${id}`, error);
      throw new InternalServerErrorException('Failed to delete survey template');
    }
  }

  async toggle(id: string): Promise<SurveyTemplateRow> {
    const client = this.supabase_service.getClient();

    const { data: current, error: fetch_error } = await client
      .from('survey_templates')
      .select('is_active')
      .eq('id', id)
      .single();

    if (fetch_error || !current) {
      throw new NotFoundException(`Survey template ${id} not found`);
    }

    const { data, error } = await client
      .from('survey_templates')
      .update({ is_active: !current.is_active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new InternalServerErrorException('Failed to toggle survey template');
    }

    return data as SurveyTemplateRow;
  }

  async duplicate(id: string): Promise<SurveyTemplateWithQuestions> {
    const client = this.supabase_service.getClient();

    const original = await this.find_one(id);

    // Create new template
    const { data: new_template, error: create_error } = await client
      .from('survey_templates')
      .insert({
        name: `${original.name} (Copy)`,
        description: original.description,
        category: original.category,
        is_active: false,
        created_by: original.created_by,
      })
      .select()
      .single();

    if (create_error || !new_template) {
      this.logger.error('Failed to duplicate survey template', create_error);
      throw new InternalServerErrorException('Failed to duplicate survey template');
    }

    // Copy questions
    if (original.survey_questions && original.survey_questions.length > 0) {
      const question_rows = original.survey_questions.map((q) => ({
        template_id: new_template.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        is_required: q.is_required,
        is_skippable: q.is_skippable,
        sort_order: q.sort_order,
      }));

      const { error: q_error } = await client
        .from('survey_questions')
        .insert(question_rows);

      if (q_error) {
        this.logger.error('Failed to copy survey questions', q_error);
      }
    }

    return this.find_one(new_template.id);
  }

  // ─── Questions ─────────────────────────────────────────────────

  async add_question(template_id: string, dto: CreateSurveyQuestionDto): Promise<SurveyQuestionRow> {
    const client = this.supabase_service.getClient();

    // Verify template exists
    const { error: check_error } = await client
      .from('survey_templates')
      .select('id')
      .eq('id', template_id)
      .single();

    if (check_error) {
      throw new NotFoundException(`Survey template ${template_id} not found`);
    }

    const insert_data: Record<string, unknown> = {
      template_id,
      question_text: dto.question_text,
    };
    if (dto.question_type !== undefined) insert_data.question_type = dto.question_type;
    if (dto.options !== undefined) insert_data.options = dto.options;
    if (dto.is_required !== undefined) insert_data.is_required = dto.is_required;
    if (dto.is_skippable !== undefined) insert_data.is_skippable = dto.is_skippable;
    if (dto.sort_order !== undefined) insert_data.sort_order = dto.sort_order;

    const { data, error } = await client
      .from('survey_questions')
      .insert(insert_data)
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to add survey question', error);
      throw new InternalServerErrorException('Failed to add survey question');
    }

    return data as SurveyQuestionRow;
  }

  async update_question(question_id: string, dto: UpdateSurveyQuestionDto): Promise<SurveyQuestionRow> {
    const client = this.supabase_service.getClient();

    const update_data: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.question_text !== undefined) update_data.question_text = dto.question_text;
    if (dto.question_type !== undefined) update_data.question_type = dto.question_type;
    if (dto.options !== undefined) update_data.options = dto.options;
    if (dto.is_required !== undefined) update_data.is_required = dto.is_required;
    if (dto.is_skippable !== undefined) update_data.is_skippable = dto.is_skippable;
    if (dto.sort_order !== undefined) update_data.sort_order = dto.sort_order;

    const { data, error } = await client
      .from('survey_questions')
      .update(update_data)
      .eq('id', question_id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Survey question ${question_id} not found`);
    }

    return data as SurveyQuestionRow;
  }

  async remove_question(question_id: string): Promise<void> {
    const client = this.supabase_service.getClient();
    const { error } = await client.from('survey_questions').delete().eq('id', question_id);
    if (error) {
      this.logger.error(`Failed to delete survey question ${question_id}`, error);
      throw new InternalServerErrorException('Failed to delete survey question');
    }
  }
}
