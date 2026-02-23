import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { CreateRefundDto, CreateRefundProductDto } from './dto/createRefund.dto.js';
import { UpdateRefundDto } from './dto/updateRefund.dto.js';
import { GetRefundsDto } from './dto/getRefunds.dto.js';
import { AddRefundActionDto } from './dto/addRefundAction.dto.js';

export interface RefundRequestRow {
  id: string;
  request_id: string;
  order_id: string;
  ticket_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  customer_pin: string | null;
  customer_type: string;
  order_date: string | null;
  cod_amount: number;
  prepaid_amount: number;
  total_amount: number;
  quantity: number;
  payment_mode: string | null;
  utr_number: string | null;
  discount_value: number;
  discount_percent: number;
  coins_used: number;
  product_name: string | null;
  product_sku: string | null;
  batch_no: string | null;
  product_used: string | null;
  request_type: string;
  issue_type: string;
  reason: string | null;
  additional_comment: string | null;
  product_image_urls: string[] | null;
  invoice_image_url: string | null;
  product_video_url: string | null;
  unboxing_video_url: string | null;
  unboxing_video_source: string;
  status: string;
  department: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  requested_by: string | null;
  requested_department: string | null;
  cn_number: string | null;
  order_status: string | null;
  final_action: string | null;
  final_decision: string | null;
  final_decision_by: string | null;
  final_decision_at: string | null;
  sla_hours: number;
  sla_breach_at: string | null;
  is_sla_breached: boolean;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface RefundProductRow {
  id: string;
  request_id: string | null;
  product_name: string;
  product_sku: string | null;
  available_qty: number;
  requested_qty: number;
  approved_qty: number;
  status: string;
  product_type: string;
  selling_price: number;
  created_at: string;
}

export interface RefundActionRow {
  id: string;
  request_id: string | null;
  action_by: string;
  action_by_role: string | null;
  action_by_email: string | null;
  action_type: string;
  action_amount: number;
  comment: string | null;
  attachment_url: string | null;
  created_at: string;
}

export interface RefundWithRelations extends RefundRequestRow {
  refund_request_products: RefundProductRow[];
  refund_request_actions: RefundActionRow[];
}

export interface RefundStats {
  total: number;
  pending: number;
  under_review: number;
  approved: number;
  rejected: number;
  processed: number;
  closed: number;
  sla_breached: number;
}

@Injectable()
export class RefundsService {
  private readonly logger = new Logger(RefundsService.name);

  constructor(private readonly supabase_service: SupabaseService) {}

  private generate_request_id(): string {
    const now = new Date();
    const date_part = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random_part = Math.floor(1000 + Math.random() * 9000).toString();
    return `RR-${date_part}-${random_part}`;
  }

  async create(dto: CreateRefundDto): Promise<RefundRequestRow> {
    const client = this.supabase_service.getClient();
    const request_id = this.generate_request_id();

    const sla_hours = dto.sla_hours ?? 48;
    const sla_breach_at = new Date(
      Date.now() + sla_hours * 60 * 60 * 1000,
    ).toISOString();

    const insert_data: Record<string, unknown> = {
      request_id,
      order_id: dto.order_id,
      ticket_id: dto.ticket_id ?? null,
      customer_name: dto.customer_name ?? null,
      customer_phone: dto.customer_phone ?? null,
      customer_email: dto.customer_email ?? null,
      customer_pin: dto.customer_pin ?? null,
      customer_type: dto.customer_type ?? 'New Buyer',
      order_date: dto.order_date ?? null,
      cod_amount: dto.cod_amount ?? 0,
      prepaid_amount: dto.prepaid_amount ?? 0,
      total_amount: dto.total_amount ?? 0,
      quantity: dto.quantity ?? 1,
      payment_mode: dto.payment_mode ?? null,
      utr_number: dto.utr_number ?? null,
      discount_value: dto.discount_value ?? 0,
      discount_percent: dto.discount_percent ?? 0,
      coins_used: dto.coins_used ?? 0,
      product_name: dto.product_name ?? null,
      product_sku: dto.product_sku ?? null,
      batch_no: dto.batch_no ?? null,
      product_used: dto.product_used ?? null,
      request_type: dto.request_type ?? 'refund',
      issue_type: dto.issue_type ?? 'others',
      reason: dto.reason ?? null,
      additional_comment: dto.additional_comment ?? null,
      product_image_urls: dto.product_image_urls ?? null,
      invoice_image_url: dto.invoice_image_url ?? null,
      product_video_url: dto.product_video_url ?? null,
      unboxing_video_url: dto.unboxing_video_url ?? null,
      unboxing_video_source: dto.unboxing_video_source ?? 'google_drive',
      status: 'pending',
      department: dto.department ?? 'Support',
      assigned_to: dto.assigned_to ?? null,
      assigned_to_name: dto.assigned_to_name ?? null,
      requested_by: dto.requested_by ?? null,
      requested_department: dto.requested_department ?? null,
      cn_number: dto.cn_number ?? null,
      order_status: dto.order_status ?? null,
      sla_hours,
      sla_breach_at,
      is_sla_breached: false,
    };

    const { data, error } = await client
      .from('refund_requests')
      .insert(insert_data)
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to create refund request', error);
      throw new InternalServerErrorException('Failed to create refund request');
    }

    const refund = data as RefundRequestRow;

    if (dto.products && dto.products.length > 0) {
      await this.insert_products(refund.id, dto.products);
    }

    return refund;
  }

  private async insert_products(
    refund_id: string,
    products: CreateRefundProductDto[],
  ): Promise<void> {
    const client = this.supabase_service.getClient();

    const rows = products.map((p) => ({
      request_id: refund_id,
      product_name: p.product_name,
      product_sku: p.product_sku ?? null,
      available_qty: p.available_qty ?? 0,
      requested_qty: p.requested_qty ?? 1,
      approved_qty: 0,
      status: 'pending',
      product_type: p.product_type ?? 'Product',
      selling_price: p.selling_price ?? 0,
    }));

    const { error } = await client
      .from('refund_request_products')
      .insert(rows);

    if (error) {
      this.logger.error('Failed to insert refund products', error);
      throw new InternalServerErrorException('Failed to insert refund products');
    }
  }

  async find_all(
    dto: GetRefundsDto,
  ): Promise<{ data: RefundRequestRow[]; total: number; page: number; limit: number }> {
    const client = this.supabase_service.getClient();
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const offset = (page - 1) * limit;

    let query = client
      .from('refund_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (dto.status) {
      query = query.eq('status', dto.status);
    }
    if (dto.department) {
      query = query.eq('department', dto.department);
    }
    if (dto.assigned_to) {
      query = query.eq('assigned_to', dto.assigned_to);
    }
    if (dto.is_sla_breached !== undefined) {
      query = query.eq('is_sla_breached', dto.is_sla_breached);
    }
    if (dto.search) {
      query = query.or(
        `request_id.ilike.%${dto.search}%,order_id.ilike.%${dto.search}%,customer_name.ilike.%${dto.search}%,customer_phone.ilike.%${dto.search}%`,
      );
    }

    const { data, error, count } = await query;

    if (error) {
      this.logger.error('Failed to fetch refund requests', error);
      throw new InternalServerErrorException('Failed to fetch refund requests');
    }

    return {
      data: (data || []) as RefundRequestRow[],
      total: count ?? 0,
      page,
      limit,
    };
  }

  async find_one(id: string): Promise<RefundWithRelations> {
    const client = this.supabase_service.getClient();

    const { data, error } = await client
      .from('refund_requests')
      .select(
        '*, refund_request_products(*), refund_request_actions(*)',
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Refund request ${id} not found`);
    }

    const refund = data as RefundWithRelations;

    if (refund.refund_request_actions) {
      refund.refund_request_actions.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }

    return refund;
  }

  async update(id: string, dto: UpdateRefundDto): Promise<RefundRequestRow> {
    const client = this.supabase_service.getClient();

    await this.find_one(id);

    const update_data: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    const updatable_fields: (keyof UpdateRefundDto)[] = [
      'status', 'department', 'assigned_to', 'assigned_to_name',
      'ticket_id', 'customer_name', 'customer_phone', 'customer_email',
      'customer_pin', 'customer_type', 'order_date',
      'cod_amount', 'prepaid_amount', 'total_amount', 'quantity',
      'payment_mode', 'utr_number', 'discount_value', 'discount_percent',
      'coins_used', 'product_name', 'product_sku', 'batch_no', 'product_used',
      'request_type', 'issue_type', 'reason', 'additional_comment',
      'product_image_urls', 'invoice_image_url', 'product_video_url',
      'unboxing_video_url', 'unboxing_video_source',
      'requested_by', 'requested_department', 'cn_number', 'order_status',
      'final_action', 'final_decision', 'final_decision_by', 'final_decision_at',
      'sla_hours', 'sla_breach_at', 'is_sla_breached', 'closed_at',
    ];

    for (const field of updatable_fields) {
      if (dto[field] !== undefined) {
        update_data[field] = dto[field];
      }
    }

    if (dto.status === 'closed' && !dto.closed_at) {
      update_data.closed_at = new Date().toISOString();
    }

    if (dto.sla_hours !== undefined && !dto.sla_breach_at) {
      const { data: current } = await client
        .from('refund_requests')
        .select('created_at')
        .eq('id', id)
        .single();

      if (current) {
        const created = new Date(current.created_at as string).getTime();
        update_data.sla_breach_at = new Date(
          created + dto.sla_hours * 60 * 60 * 1000,
        ).toISOString();
      }
    }

    const { data, error } = await client
      .from('refund_requests')
      .update(update_data)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to update refund request', error);
      throw new InternalServerErrorException('Failed to update refund request');
    }

    return data as RefundRequestRow;
  }

  async add_action(
    id: string,
    dto: AddRefundActionDto,
  ): Promise<RefundActionRow> {
    const client = this.supabase_service.getClient();

    await this.find_one(id);

    const { data, error } = await client
      .from('refund_request_actions')
      .insert({
        request_id: id,
        action_by: dto.action_by,
        action_by_role: dto.action_by_role ?? null,
        action_by_email: dto.action_by_email ?? null,
        action_type: dto.action_type,
        action_amount: dto.action_amount ?? 0,
        comment: dto.comment ?? null,
        attachment_url: dto.attachment_url ?? null,
      })
      .select()
      .single();

    if (error || !data) {
      this.logger.error('Failed to add refund action', error);
      throw new InternalServerErrorException('Failed to add refund action');
    }

    const action = data as RefundActionRow;

    const status_map: Record<string, string> = {
      approve: 'approved',
      partial_approve: 'partially_approved',
      reject: 'rejected',
      close: 'closed',
      reopen: 'pending',
    };

    const new_status = status_map[dto.action_type];
    if (new_status) {
      const status_update: Record<string, unknown> = {
        status: new_status,
        updated_at: new Date().toISOString(),
      };

      if (new_status === 'closed') {
        status_update.closed_at = new Date().toISOString();
      }

      if (dto.action_type === 'approve' || dto.action_type === 'reject') {
        status_update.final_decision = dto.action_type;
        status_update.final_decision_by = dto.action_by;
        status_update.final_decision_at = new Date().toISOString();
      }

      const { error: update_error } = await client
        .from('refund_requests')
        .update(status_update)
        .eq('id', id);

      if (update_error) {
        this.logger.error('Failed to update refund status after action', update_error);
      }
    }

    return action;
  }

  async get_stats(): Promise<RefundStats> {
    const client = this.supabase_service.getClient();

    const { count: total, error: total_error } = await client
      .from('refund_requests')
      .select('*', { count: 'exact', head: true });

    if (total_error) {
      this.logger.error('Failed to fetch total count', total_error);
      throw new InternalServerErrorException('Failed to fetch refund stats');
    }

    const status_counts = await Promise.all(
      ['pending', 'under_review', 'approved', 'rejected', 'processed', 'closed'].map(
        async (status) => {
          const { count, error } = await client
            .from('refund_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', status);

          if (error) {
            this.logger.error(`Failed to fetch count for status ${status}`, error);
            return { status, count: 0 };
          }

          return { status, count: count ?? 0 };
        },
      ),
    );

    const { count: sla_breached, error: breach_error } = await client
      .from('refund_requests')
      .select('*', { count: 'exact', head: true })
      .eq('is_sla_breached', true);

    if (breach_error) {
      this.logger.error('Failed to fetch SLA breached count', breach_error);
    }

    const counts_map = Object.fromEntries(
      status_counts.map((s) => [s.status, s.count]),
    );

    return {
      total: total ?? 0,
      pending: counts_map['pending'] ?? 0,
      under_review: counts_map['under_review'] ?? 0,
      approved: counts_map['approved'] ?? 0,
      rejected: counts_map['rejected'] ?? 0,
      processed: counts_map['processed'] ?? 0,
      closed: counts_map['closed'] ?? 0,
      sla_breached: sla_breached ?? 0,
    };
  }
}
