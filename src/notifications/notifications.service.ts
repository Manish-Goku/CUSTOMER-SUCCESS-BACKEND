import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import {
  CreateNotificationDto,
  GetNotificationsDto,
  UpdateNotificationDto,
  MarkAllReadDto,
} from './dto/notification.dto.js';
import {
  GetApprovalRequestsDto,
  ApproveRequestDto,
  RejectRequestDto,
} from './dto/approvalRequest.dto.js';
import {
  UpsertPreferencesDto,
  NotificationPreferenceItemDto,
} from './dto/notificationPreference.dto.js';

const DEFAULT_PREFERENCES: Omit<NotificationPreferenceItemDto, 'name' | 'description'>[] = [];

const DEFAULT_PREFERENCE_SEEDS: { name: string; description: string }[] = [
  { name: 'missed_calls', description: 'Notifications for missed customer calls' },
  { name: 'sla_breaches', description: 'Alerts when SLA thresholds are exceeded' },
  { name: 'escalations', description: 'Ticket and call escalation alerts' },
  { name: 'assignments', description: 'New ticket or chat assignments' },
  { name: 'approval_requests', description: 'Pending approval requests requiring action' },
  { name: 'system_updates', description: 'System maintenance and update notices' },
];

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly supabase_service: SupabaseService) {}

  async create_notification(dto: CreateNotificationDto) {
    const client = this.supabase_service.getClient();

    const row = {
      type: dto.type,
      title: dto.title,
      message: dto.message,
      priority: dto.priority || 'normal',
      status: 'unread',
      reference_id: dto.reference_id || null,
      reference_type: dto.reference_type || null,
      from_user: dto.from_user || null,
      to_user: dto.to_user,
      department: dto.department || null,
      metadata: dto.metadata || {},
      requires_approval: dto.requires_approval || false,
      approval_status: dto.requires_approval ? 'pending' : null,
    };

    const { data: notification, error } = await client
      .from('notifications')
      .insert(row)
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to create notification: ${error.message}`);
      throw error;
    }

    // If requires approval, also create an approval_request row
    if (dto.requires_approval && dto.approval_type) {
      const approval_row = {
        type: dto.approval_type,
        requested_by: dto.requested_by || dto.from_user || 'unknown',
        requested_by_name: dto.requested_by_name || dto.from_user || 'Unknown',
        reason: dto.approval_reason || dto.message,
        metadata: dto.metadata || {},
        notification_id: notification.id,
      };

      const { error: approval_error } = await client
        .from('approval_requests')
        .insert(approval_row);

      if (approval_error) {
        this.logger.error(`Failed to create approval request: ${approval_error.message}`);
      }
    }

    this.logger.log(`Created notification: ${notification.id} [${dto.type}] → ${dto.to_user}`);
    return notification;
  }

  async find_all_notifications(dto: GetNotificationsDto) {
    const client = this.supabase_service.getClient();
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const offset = (page - 1) * limit;

    let query = client
      .from('notifications')
      .select('*', { count: 'exact' });

    if (dto.type) query = query.eq('type', dto.type);
    if (dto.status) query = query.eq('status', dto.status);
    if (dto.priority) query = query.eq('priority', dto.priority);
    if (dto.to_user) query = query.eq('to_user', dto.to_user);
    if (dto.search) {
      query = query.or(`title.ilike.%${dto.search}%,message.ilike.%${dto.search}%`);
    }

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      this.logger.error(`Failed to fetch notifications: ${error.message}`);
      throw error;
    }

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
    };
  }

  async update_notification(id: string, dto: UpdateNotificationDto) {
    const client = this.supabase_service.getClient();
    const now = new Date().toISOString();

    const update_data: Record<string, unknown> = {
      status: dto.status,
      updated_at: now,
    };

    if (dto.status === 'read') update_data.read_at = now;
    if (dto.status === 'actioned') update_data.actioned_at = now;

    const { data, error } = await client
      .from('notifications')
      .update(update_data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to update notification ${id}: ${error.message}`);
      throw new NotFoundException(`Notification not found: ${id}`);
    }

    return data;
  }

  async mark_all_read(dto: MarkAllReadDto) {
    const client = this.supabase_service.getClient();
    const now = new Date().toISOString();

    const { data, error } = await client
      .from('notifications')
      .update({ status: 'read', read_at: now, updated_at: now })
      .eq('to_user', dto.to_user)
      .eq('status', 'unread')
      .select('id');

    if (error) {
      this.logger.error(`Failed to mark all read for ${dto.to_user}: ${error.message}`);
      throw error;
    }

    return { updated: data?.length || 0 };
  }

  async get_unread_count(user_id: string) {
    const client = this.supabase_service.getClient();

    const { count, error } = await client
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('to_user', user_id)
      .eq('status', 'unread');

    if (error) {
      this.logger.error(`Failed to get unread count for ${user_id}: ${error.message}`);
      throw error;
    }

    return { unread_count: count || 0 };
  }

  async find_all_approval_requests(dto: GetApprovalRequestsDto) {
    const client = this.supabase_service.getClient();
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const offset = (page - 1) * limit;

    let query = client
      .from('approval_requests')
      .select('*, notifications(*)', { count: 'exact' });

    if (dto.status) query = query.eq('status', dto.status);
    if (dto.type) query = query.eq('type', dto.type);
    if (dto.requested_by) query = query.eq('requested_by', dto.requested_by);

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      this.logger.error(`Failed to fetch approval requests: ${error.message}`);
      throw error;
    }

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
    };
  }

  async approve_request(id: string, dto: ApproveRequestDto) {
    const client = this.supabase_service.getClient();
    const now = new Date().toISOString();

    const { data: request, error } = await client
      .from('approval_requests')
      .update({
        status: 'approved',
        reviewed_by: dto.reviewed_by,
        reviewed_at: now,
        comments: dto.comments || null,
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to approve request ${id}: ${error.message}`);
      throw new NotFoundException(`Approval request not found: ${id}`);
    }

    // Update linked notification
    if (request.notification_id) {
      await client
        .from('notifications')
        .update({
          approval_status: 'approved',
          approved_by: dto.reviewed_by,
          approved_at: now,
          status: 'actioned',
          actioned_at: now,
          updated_at: now,
        })
        .eq('id', request.notification_id);
    }

    this.logger.log(`Approved request ${id} by ${dto.reviewed_by}`);
    return request;
  }

  async reject_request(id: string, dto: RejectRequestDto) {
    const client = this.supabase_service.getClient();
    const now = new Date().toISOString();

    const { data: request, error } = await client
      .from('approval_requests')
      .update({
        status: 'rejected',
        reviewed_by: dto.reviewed_by,
        reviewed_at: now,
        comments: dto.comments,
        updated_at: now,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to reject request ${id}: ${error.message}`);
      throw new NotFoundException(`Approval request not found: ${id}`);
    }

    // Update linked notification
    if (request.notification_id) {
      await client
        .from('notifications')
        .update({
          approval_status: 'rejected',
          rejected_reason: dto.comments,
          status: 'actioned',
          actioned_at: now,
          updated_at: now,
        })
        .eq('id', request.notification_id);
    }

    this.logger.log(`Rejected request ${id} by ${dto.reviewed_by}`);
    return request;
  }

  async get_preferences(user_id: string) {
    const client = this.supabase_service.getClient();

    const { data, error } = await client
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user_id)
      .order('name');

    if (error) {
      this.logger.error(`Failed to get preferences for ${user_id}: ${error.message}`);
      throw error;
    }

    // Seed defaults if no preferences exist
    if (!data || data.length === 0) {
      const defaults = DEFAULT_PREFERENCE_SEEDS.map((seed) => ({
        user_id,
        name: seed.name,
        description: seed.description,
        email: true,
        sms: false,
        push: true,
      }));

      const { data: seeded, error: seed_error } = await client
        .from('notification_preferences')
        .insert(defaults)
        .select();

      if (seed_error) {
        this.logger.error(`Failed to seed preferences for ${user_id}: ${seed_error.message}`);
        throw seed_error;
      }

      return seeded;
    }

    return data;
  }

  async upsert_preferences(user_id: string, dto: UpsertPreferencesDto) {
    const client = this.supabase_service.getClient();
    const now = new Date().toISOString();

    const rows = dto.preferences.map((pref) => ({
      user_id,
      name: pref.name,
      description: pref.description || null,
      email: pref.email,
      sms: pref.sms,
      push: pref.push,
      updated_at: now,
    }));

    const { data, error } = await client
      .from('notification_preferences')
      .upsert(rows, { onConflict: 'user_id,name' })
      .select();

    if (error) {
      this.logger.error(`Failed to upsert preferences for ${user_id}: ${error.message}`);
      throw error;
    }

    return data;
  }
}
