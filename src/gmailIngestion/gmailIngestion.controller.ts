import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { GmailIngestionService } from './gmailIngestion.service.js';
import { AddSupportEmailDto } from './dto/addSupportEmail.dto.js';
import { UpdateSupportEmailDto } from './dto/updateSupportEmail.dto.js';
import { SupportEmailResponseDto } from './dto/supportEmailResponse.dto.js';
import { EmailResponseDto } from './dto/emailResponse.dto.js';
import { GetEmailsDto } from './dto/getEmails.dto.js';

@ApiTags('support-emails')
@Controller('support-emails')
export class GmailIngestionController {
  constructor(
    private readonly gmail_ingestion_service: GmailIngestionService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Add a new email address to monitor' })
  @ApiCreatedResponse({
    description: 'Email added and watch started',
    type: SupportEmailResponseDto,
  })
  async add_support_email(
    @Body() dto: AddSupportEmailDto,
  ): Promise<SupportEmailResponseDto> {
    return this.gmail_ingestion_service.add_support_email(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all monitored email addresses' })
  @ApiOkResponse({
    description: 'List of support emails',
    type: [SupportEmailResponseDto],
  })
  async get_support_emails(): Promise<SupportEmailResponseDto[]> {
    return this.gmail_ingestion_service.get_support_emails();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific monitored email' })
  @ApiParam({ name: 'id', description: 'Support email UUID' })
  async get_support_email(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SupportEmailResponseDto> {
    return this.gmail_ingestion_service.get_support_email(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a monitored email (toggle active, change name)',
  })
  @ApiParam({ name: 'id', description: 'Support email UUID' })
  async update_support_email(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupportEmailDto,
  ): Promise<SupportEmailResponseDto> {
    return this.gmail_ingestion_service.update_support_email(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an email and stop its Gmail watch' })
  @ApiParam({ name: 'id', description: 'Support email UUID' })
  async remove_support_email(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.gmail_ingestion_service.remove_support_email(id);
  }

  @Post(':id/watch')
  @ApiOperation({ summary: 'Manually start Gmail watch on this email' })
  @ApiParam({ name: 'id', description: 'Support email UUID' })
  async start_watch(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean; expiration: string }> {
    return this.gmail_ingestion_service.start_watch(id);
  }

  @Post(':id/stop-watch')
  @ApiOperation({ summary: 'Manually stop Gmail watch on this email' })
  @ApiParam({ name: 'id', description: 'Support email UUID' })
  async stop_watch(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: boolean }> {
    return this.gmail_ingestion_service.stop_watch(id);
  }
}

@ApiTags('emails')
@Controller('emails')
export class EmailsController {
  constructor(
    private readonly gmail_ingestion_service: GmailIngestionService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List received emails with pagination' })
  @ApiQuery({ name: 'support_email_id', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Paginated list of emails' })
  async get_emails(
    @Query() dto: GetEmailsDto,
  ): Promise<{ data: EmailResponseDto[]; total: number }> {
    return this.gmail_ingestion_service.get_emails(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full email details' })
  @ApiParam({ name: 'id', description: 'Email UUID' })
  async get_email(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EmailResponseDto> {
    return this.gmail_ingestion_service.get_email(id);
  }
}
