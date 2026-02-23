import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ChatIngestionService } from './chatIngestion.service.js';
import { GetConversationsDto } from './dto/getConversations.dto.js';
import { UpdateConversationDto } from './dto/updateConversation.dto.js';
import { SendMessageDto } from './dto/sendMessage.dto.js';
import { ConversationResponseDto } from './dto/conversationResponse.dto.js';
import { ChatMessageResponseDto } from './dto/chatMessageResponse.dto.js';

@ApiTags('conversations')
@Controller('conversations')
export class ConversationsController {
  constructor(
    private readonly chat_ingestion_service: ChatIngestionService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List conversations with pagination and filters' })
  @ApiOkResponse({ description: 'Paginated list of conversations' })
  async get_conversations(
    @Query() dto: GetConversationsDto,
  ): Promise<{ data: ConversationResponseDto[]; total: number }> {
    return this.chat_ingestion_service.get_conversations(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single conversation' })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  async get_conversation(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ConversationResponseDto> {
    return this.chat_ingestion_service.get_conversation(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update conversation status, team, or agent' })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  async update_conversation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConversationDto,
  ): Promise<ConversationResponseDto> {
    return this.chat_ingestion_service.update_conversation(id, dto);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages for a conversation (chronological)' })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async get_messages(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{ data: ChatMessageResponseDto[]; total: number }> {
    return this.chat_ingestion_service.get_messages(
      id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
    );
  }

  @Post(':id/reply')
  @ApiOperation({ summary: 'Agent sends a reply via Interakt/WhatsApp' })
  @ApiParam({ name: 'id', description: 'Conversation UUID' })
  async send_reply(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SendMessageDto,
  ): Promise<ChatMessageResponseDto> {
    return this.chat_ingestion_service.send_reply(id, dto);
  }
}

@ApiTags('chat-messages')
@Controller('messages')
export class ChatMessagesController {
  constructor(
    private readonly chat_ingestion_service: ChatIngestionService,
  ) {}

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a message as read, decrement unread_count' })
  @ApiParam({ name: 'id', description: 'Message UUID' })
  async mark_read(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ChatMessageResponseDto> {
    return this.chat_ingestion_service.mark_message_read(id);
  }
}
