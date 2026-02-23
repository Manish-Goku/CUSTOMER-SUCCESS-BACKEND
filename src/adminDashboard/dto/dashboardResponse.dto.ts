import { ApiProperty } from '@nestjs/swagger';

export class TeamCountDto {
  @ApiProperty({ example: 'dispatch' })
  team: string;

  @ApiProperty({ example: 42 })
  count: number;
}

export class TopSenderDto {
  @ApiProperty({ example: 'customer@gmail.com' })
  from_address: string;

  @ApiProperty({ example: 15 })
  count: number;
}

export class DailyVolumeDto {
  @ApiProperty({ example: '2026-02-22' })
  date: string;

  @ApiProperty({ example: 28 })
  count: number;
}

export class MailboxCountDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  support_email_id: string;

  @ApiProperty({ example: 'support@katyayaniorganics.com' })
  email_address: string;

  @ApiProperty({ example: 'KO Support', nullable: true })
  display_name: string | null;

  @ApiProperty({ example: 120 })
  count: number;
}

export class DashboardOverviewDto {
  @ApiProperty({ example: 350 })
  email_volume: number;

  @ApiProperty({ type: [TeamCountDto] })
  emails_by_team: TeamCountDto[];

  @ApiProperty({ example: 45 })
  unread_count: number;

  @ApiProperty({ type: [TopSenderDto] })
  top_senders: TopSenderDto[];

  @ApiProperty({ type: [DailyVolumeDto] })
  daily_volume: DailyVolumeDto[];

  @ApiProperty({ type: [MailboxCountDto] })
  emails_by_mailbox: MailboxCountDto[];
}
