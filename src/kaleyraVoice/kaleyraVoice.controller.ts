import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';
import { KaleyraVoiceService } from './kaleyraVoice.service.js';
import { ClickToCallDto } from './dto/clickToCall.dto.js';
import { OutboundCallDto } from './dto/outboundCall.dto.js';
import { CallLogsQueryDto } from './dto/callLogs.dto.js';
import {
  SyncCallLogsDto,
  SyncResultDto,
} from './dto/callDashboard.dto.js';
import { KaleyraCdrDto } from './dto/kaleyraCdr.dto.js';

@ApiTags('calls')
@Controller()
export class KaleyraVoiceController {
  private readonly logger = new Logger(KaleyraVoiceController.name);

  constructor(private readonly kaleyra_voice_service: KaleyraVoiceService) {}

  @Post('calls/click-to-call')
  @ApiOperation({ summary: 'Initiate click-to-call via Kaleyra' })
  @ApiCreatedResponse({ description: 'Call initiated — agent phone will ring first' })
  async click_to_call(
    @Body() dto: ClickToCallDto,
  ): Promise<{ call_id: string; status: string; message: string }> {
    return this.kaleyra_voice_service.click_to_call(
      dto.agent_number,
      dto.customer_number,
      dto.agent_name,
    );
  }

  @Post('calls/outbound')
  @ApiOperation({ summary: 'Initiate automated outbound call via Kaleyra' })
  @ApiCreatedResponse({ description: 'Outbound call initiated' })
  async outbound_call(
    @Body() dto: OutboundCallDto,
  ): Promise<{ call_id: string; status: string; message: string }> {
    return this.kaleyra_voice_service.outbound_call(
      dto.customer_number,
      dto.play,
      dto.campaign,
    );
  }

  @Get('webhooks/kaleyra/callback')
  @HttpCode(200)
  @ApiOperation({ summary: 'Receive Kaleyra call status callback (GET with query params)' })
  @ApiOkResponse({ description: 'Callback acknowledged' })
  async kaleyra_callback(
    @Query() query: Record<string, string>,
  ): Promise<{ status: string }> {
    this.logger.log(`Kaleyra callback received: ${JSON.stringify(query).slice(0, 300)}`);

    // Fire-and-forget: return 200 fast
    this.kaleyra_voice_service
      .process_callback(query)
      .catch((err) => {
        this.logger.error('Error processing Kaleyra callback', err);
      });

    return { status: 'ok' };
  }

  @Get('calls/logs')
  @ApiOperation({ summary: 'Fetch Kaleyra click-to-call logs (raw from Kaleyra API)' })
  @ApiOkResponse({ description: 'Call logs from Kaleyra' })
  async get_call_logs(@Query() dto: CallLogsQueryDto): Promise<unknown> {
    return this.kaleyra_voice_service.get_call_logs({
      from_date: dto.from_date,
      to_date: dto.to_date,
      call_to: dto.call_to,
      page: dto.page,
      limit: dto.limit,
    });
  }

  // ── CDR Webhook ──

  @Post('webhooks/kaleyra/cdr')
  @HttpCode(200)
  @ApiOperation({ summary: 'Receive Kaleyra CDR (Call Detail Record) webhook push' })
  @ApiOkResponse({ description: 'CDR acknowledged' })
  async kaleyra_cdr_webhook(
    @Body() dto: KaleyraCdrDto,
  ): Promise<{ status: string }> {
    this.logger.log(`Kaleyra CDR webhook received: ${JSON.stringify(dto).slice(0, 300)}`);

    this.kaleyra_voice_service
      .process_cdr_webhook(dto as Record<string, unknown>)
      .catch((err) => {
        this.logger.error('Error processing Kaleyra CDR webhook', err);
      });

    return { status: 'ok' };
  }

  // ── Sync Status ──

  @Get('calls/sync-status')
  @ApiOperation({ summary: 'Get auto-sync status and last synced time' })
  @ApiOkResponse({ description: 'Sync status' })
  async get_sync_status(): Promise<{
    last_synced_at: string | null;
    auto_sync_enabled: boolean;
    sync_interval_minutes: number;
  }> {
    return this.kaleyra_voice_service.get_sync_status();
  }

  // ── Sync ──

  @Post('calls/sync')
  @ApiOperation({ summary: 'Sync call logs from Kaleyra API into ivr_calls' })
  @ApiCreatedResponse({ type: SyncResultDto })
  async sync_call_logs(@Body() dto: SyncCallLogsDto): Promise<SyncResultDto> {
    return this.kaleyra_voice_service.sync_call_logs(dto.from_date, dto.to_date);
  }
}
