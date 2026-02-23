import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { CreateConsultationDto, UpdateConsultationDto } from './dto/createConsultation.dto.js';
import { GetConsultationsDto } from './dto/getConsultations.dto.js';
import { CreatePrescriptionDto } from './dto/createPrescription.dto.js';

export interface ConsultationRow {
  id: string;
  farmer_name: string;
  farmer_phone: string | null;
  crop_type: string | null;
  issue: string | null;
  status: string | null;
  scheduled_at: string | null;
  agronomist: string | null;
  duration_seconds: number | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface PrescriptionRow {
  id: string;
  consultation_id: string;
  products: unknown;
  instructions: string | null;
  created_at: string | null;
}

@Injectable()
export class AgriConsultancyService {
  private readonly logger = new Logger(AgriConsultancyService.name);

  constructor(private readonly supabase_service: SupabaseService) {}

  async create(dto: CreateConsultationDto): Promise<ConsultationRow> {
    const client = this.supabase_service.getClient();

    const insert_data: Record<string, unknown> = {
      farmer_name: dto.farmer_name,
      status: 'scheduled',
    };
    if (dto.farmer_phone !== undefined) insert_data.farmer_phone = dto.farmer_phone;
    if (dto.crop_type !== undefined) insert_data.crop_type = dto.crop_type;
    if (dto.issue !== undefined) insert_data.issue = dto.issue;
    if (dto.scheduled_at !== undefined) insert_data.scheduled_at = dto.scheduled_at;
    if (dto.agronomist !== undefined) insert_data.agronomist = dto.agronomist;
    if (dto.notes !== undefined) insert_data.notes = dto.notes;

    const { data, error } = await client
      .from('agri_consultations')
      .insert(insert_data)
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to create consultation', error);
      throw new InternalServerErrorException('Failed to create consultation');
    }

    return data as ConsultationRow;
  }

  async find_all(dto: GetConsultationsDto): Promise<{ data: ConsultationRow[]; total: number }> {
    const client = this.supabase_service.getClient();
    const page = dto.page || 1;
    const limit = dto.limit || 50;
    const offset = (page - 1) * limit;

    let query = client
      .from('agri_consultations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (dto.status) query = query.eq('status', dto.status);
    if (dto.agronomist) query = query.eq('agronomist', dto.agronomist);
    if (dto.crop_type) query = query.eq('crop_type', dto.crop_type);
    if (dto.date_from) query = query.gte('scheduled_at', dto.date_from);
    if (dto.date_to) query = query.lte('scheduled_at', dto.date_to);
    if (dto.search) {
      query = query.or(
        `farmer_name.ilike.%${dto.search}%,farmer_phone.ilike.%${dto.search}%,crop_type.ilike.%${dto.search}%`,
      );
    }

    const { data, error, count } = await query;

    if (error) {
      this.logger.error('Failed to fetch consultations', error);
      throw new InternalServerErrorException('Failed to fetch consultations');
    }

    return { data: (data || []) as ConsultationRow[], total: count || 0 };
  }

  async update(id: string, dto: UpdateConsultationDto): Promise<ConsultationRow> {
    const client = this.supabase_service.getClient();

    const update_data: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.farmer_name !== undefined) update_data.farmer_name = dto.farmer_name;
    if (dto.farmer_phone !== undefined) update_data.farmer_phone = dto.farmer_phone;
    if (dto.crop_type !== undefined) update_data.crop_type = dto.crop_type;
    if (dto.issue !== undefined) update_data.issue = dto.issue;
    if (dto.scheduled_at !== undefined) update_data.scheduled_at = dto.scheduled_at;
    if (dto.agronomist !== undefined) update_data.agronomist = dto.agronomist;
    if (dto.notes !== undefined) update_data.notes = dto.notes;

    const { data, error } = await client
      .from('agri_consultations')
      .update(update_data)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Consultation ${id} not found`);
    }

    return data as ConsultationRow;
  }

  async start(id: string): Promise<ConsultationRow> {
    const client = this.supabase_service.getClient();

    const { data, error } = await client
      .from('agri_consultations')
      .update({
        status: 'in_progress',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Consultation ${id} not found`);
    }

    return data as ConsultationRow;
  }

  async complete(id: string, duration_seconds?: number): Promise<ConsultationRow> {
    const client = this.supabase_service.getClient();

    const update_data: Record<string, unknown> = {
      status: 'completed',
      updated_at: new Date().toISOString(),
    };
    if (duration_seconds !== undefined) update_data.duration_seconds = duration_seconds;

    const { data, error } = await client
      .from('agri_consultations')
      .update(update_data)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new NotFoundException(`Consultation ${id} not found`);
    }

    return data as ConsultationRow;
  }

  async create_prescription(dto: CreatePrescriptionDto): Promise<PrescriptionRow> {
    const client = this.supabase_service.getClient();

    // Verify consultation exists
    const { error: check_error } = await client
      .from('agri_consultations')
      .select('id')
      .eq('id', dto.consultation_id)
      .single();

    if (check_error) {
      throw new NotFoundException(`Consultation ${dto.consultation_id} not found`);
    }

    const { data, error } = await client
      .from('agri_prescriptions')
      .insert({
        consultation_id: dto.consultation_id,
        products: dto.products ?? [],
        instructions: dto.instructions ?? null,
      })
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to create prescription', error);
      throw new InternalServerErrorException('Failed to create prescription');
    }

    return data as PrescriptionRow;
  }

  async get_prescriptions(consultation_id: string): Promise<PrescriptionRow[]> {
    const client = this.supabase_service.getClient();

    const { data, error } = await client
      .from('agri_prescriptions')
      .select('*')
      .eq('consultation_id', consultation_id)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Failed to fetch prescriptions', error);
      throw new InternalServerErrorException('Failed to fetch prescriptions');
    }

    return (data || []) as PrescriptionRow[];
  }
}
