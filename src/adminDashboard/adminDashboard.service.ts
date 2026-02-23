import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { DashboardQueryDto } from './dto/dashboardQuery.dto.js';
import {
  DailyVolumeDto,
  DashboardOverviewDto,
  MailboxCountDto,
  TeamCountDto,
  TopSenderDto,
} from './dto/dashboardResponse.dto.js';

@Injectable()
export class AdminDashboardService {
  private readonly logger = new Logger(AdminDashboardService.name);

  constructor(private readonly supabase_service: SupabaseService) {}

  /** Resolve query DTO into concrete start/end timestamps */
  private resolve_dates(dto: DashboardQueryDto): { start_date: string; end_date: string } {
    const now = new Date();

    if (dto.range === 'custom') {
      if (!dto.start_date || !dto.end_date) {
        throw new BadRequestException('start_date and end_date are required when range=custom');
      }
      return { start_date: dto.start_date, end_date: dto.end_date };
    }

    const end_date = now.toISOString();
    let start: Date;

    switch (dto.range) {
      case 'today':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        break;
      case '7d':
        start = new Date(now);
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
      default:
        start = new Date(now);
        start.setDate(start.getDate() - 30);
        break;
    }

    return { start_date: start.toISOString(), end_date };
  }

  async get_overview(dto: DashboardQueryDto): Promise<DashboardOverviewDto> {
    const { start_date, end_date } = this.resolve_dates(dto);
    const limit = dto.top_senders_limit ?? 10;

    const [email_volume, emails_by_team, unread_count, top_senders, daily_volume, emails_by_mailbox] =
      await Promise.all([
        this.rpc_email_volume(start_date, end_date),
        this.rpc_emails_by_team(start_date, end_date),
        this.rpc_unread_count(start_date, end_date),
        this.rpc_top_senders(start_date, end_date, limit),
        this.rpc_daily_volume(start_date, end_date),
        this.rpc_emails_by_mailbox(start_date, end_date),
      ]);

    return { email_volume, emails_by_team, unread_count, top_senders, daily_volume, emails_by_mailbox };
  }

  async get_email_volume(dto: DashboardQueryDto): Promise<number> {
    const { start_date, end_date } = this.resolve_dates(dto);
    return this.rpc_email_volume(start_date, end_date);
  }

  async get_emails_by_team(dto: DashboardQueryDto): Promise<TeamCountDto[]> {
    const { start_date, end_date } = this.resolve_dates(dto);
    return this.rpc_emails_by_team(start_date, end_date);
  }

  async get_unread_count(dto: DashboardQueryDto): Promise<number> {
    const { start_date, end_date } = this.resolve_dates(dto);
    return this.rpc_unread_count(start_date, end_date);
  }

  async get_top_senders(dto: DashboardQueryDto): Promise<TopSenderDto[]> {
    const { start_date, end_date } = this.resolve_dates(dto);
    return this.rpc_top_senders(start_date, end_date, dto.top_senders_limit ?? 10);
  }

  async get_daily_volume(dto: DashboardQueryDto): Promise<DailyVolumeDto[]> {
    const { start_date, end_date } = this.resolve_dates(dto);
    return this.rpc_daily_volume(start_date, end_date);
  }

  async get_emails_by_mailbox(dto: DashboardQueryDto): Promise<MailboxCountDto[]> {
    const { start_date, end_date } = this.resolve_dates(dto);
    return this.rpc_emails_by_mailbox(start_date, end_date);
  }

  // ── RPC wrappers ──

  private async rpc_email_volume(start_date: string, end_date: string): Promise<number> {
    const client = this.supabase_service.getClient();
    const { data, error } = await client.rpc('get_email_volume', { start_date, end_date });

    if (error) {
      this.logger.error('get_email_volume RPC failed', error);
      throw error;
    }
    return data ?? 0;
  }

  private async rpc_emails_by_team(start_date: string, end_date: string): Promise<TeamCountDto[]> {
    const client = this.supabase_service.getClient();
    const { data, error } = await client.rpc('get_emails_by_team', { start_date, end_date });

    if (error) {
      this.logger.error('get_emails_by_team RPC failed', error);
      throw error;
    }
    return (data ?? []) as TeamCountDto[];
  }

  private async rpc_unread_count(start_date: string, end_date: string): Promise<number> {
    const client = this.supabase_service.getClient();
    const { data, error } = await client.rpc('get_unread_count', { start_date, end_date });

    if (error) {
      this.logger.error('get_unread_count RPC failed', error);
      throw error;
    }
    return data ?? 0;
  }

  private async rpc_top_senders(
    start_date: string,
    end_date: string,
    sender_limit: number,
  ): Promise<TopSenderDto[]> {
    const client = this.supabase_service.getClient();
    const { data, error } = await client.rpc('get_top_senders', { start_date, end_date, sender_limit });

    if (error) {
      this.logger.error('get_top_senders RPC failed', error);
      throw error;
    }
    return (data ?? []) as TopSenderDto[];
  }

  private async rpc_daily_volume(start_date: string, end_date: string): Promise<DailyVolumeDto[]> {
    const client = this.supabase_service.getClient();
    const { data, error } = await client.rpc('get_daily_volume', { start_date, end_date });

    if (error) {
      this.logger.error('get_daily_volume RPC failed', error);
      throw error;
    }
    return (data ?? []) as DailyVolumeDto[];
  }

  private async rpc_emails_by_mailbox(start_date: string, end_date: string): Promise<MailboxCountDto[]> {
    const client = this.supabase_service.getClient();
    const { data, error } = await client.rpc('get_emails_by_mailbox', { start_date, end_date });

    if (error) {
      this.logger.error('get_emails_by_mailbox RPC failed', error);
      throw error;
    }
    return (data ?? []) as MailboxCountDto[];
  }
}
