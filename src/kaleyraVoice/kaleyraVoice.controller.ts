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
  @ApiOperation({ summary: 'Fetch Kaleyra click-to-call logs' })
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
}
