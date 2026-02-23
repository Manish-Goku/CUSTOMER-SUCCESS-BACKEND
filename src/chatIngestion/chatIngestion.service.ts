import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { InteraktService } from './interakt.service.js';
import { ChatAiService } from './chatAi.service.js';
import { ChatGateway } from './chatGateway.gateway.js';
import { InteraktWebhookDto } from './dto/interaktWebhook.dto.js';
import { SendMessageDto } from './dto/sendMessage.dto.js';
import { GetConversationsDto } from './dto/getConversations.dto.js';
import { UpdateConversationDto } from './dto/updateConversation.dto.js';
import { ConversationResponseDto } from './dto/conversationResponse.dto.js';
import { ChatMessageResponseDto } from './dto/chatMessageResponse.dto.js';
import {
  ConversationRecord,
  ChatMessageRecord,
} from '../common/interfaces/chatTypes.js';

@Injectable()
export class ChatIngestionService {
  private readonly logger = new Logger(ChatIngestionService.name);

  constructor(
    private readonly supabase_service: SupabaseService,
    private readonly interakt_service: InteraktService,
    private readonly chat_ai_service: ChatAiService,
    private readonly chat_gateway: ChatGateway,
  ) {}

  // --- Webhook Processing ---

  async process_webhook(payload: InteraktWebhookDto): Promise<void> {
    if (payload.type !== 'message_received') {
      this.logger.log(`Ignoring webhook event type: ${payload.type}`);
      return;
    }

    const customer = payload.data?.customer;
    const message = payload.data?.message;

    if (!customer?.phone_number || !message) {
      this.logger.warn('Webhook missing customer phone or message data');
      return;
    }

    const phone_number = customer.phone_number;
    const interakt_message_id = message.id || null;
    const customer_name = customer.name || null;
    const message_type = this.normalize_message_type(message.type);
    const content = message.text || null;
    const media_url = message.media_url || null;

    const client = this.supabase_service.getClient();

    // Dedup by interakt_message_id
    if (interakt_message_id) {
      const { data: existing } = await client
        .from('chat_messages')
        .select('id')
        .eq('interakt_message_id', interakt_message_id)
        .single();

      if (existing) {
        this.logger.log(`Duplicate message ignored: ${interakt_message_id}`);
        return;
      }
    }

    // Find or create conversation
    let { data: conversation } = await client
      .from('conversations')
      .select('*')
      .eq('phone_number', phone_number)
      .single();

    let is_new_or_reopened = false;

    if (!conversation) {
      // Create new conversation
      const { data: new_conv, error: insert_error } = await client
        .from('conversations')
        .insert({
          phone_number,
          customer_name,
          status: 'open',
        })
        .select()
        .single();

      if (insert_error || !new_conv) {
        this.logger.error('Failed to create conversation', insert_error);
        return;
      }

      conversation = new_conv;
      is_new_or_reopened = true;
    } else if (conversation.status === 'resolved') {
      // Reopen resolved conversation
      const { data: reopened, error: reopen_error } = await client
        .from('conversations')
        .update({ status: 'open', updated_at: new Date().toISOString() })
        .eq('id', conversation.id)
        .select()
        .single();

      if (reopen_error || !reopened) {
        this.logger.error('Failed to reopen conversation', reopen_error);
        return;
      }

      conversation = reopened;
      is_new_or_reopened = true;
    }

    // AI classify first inbound of new/reopened conversation only
    let summary: string | null = null;
    let suggested_team: string | null = null;

    if (is_new_or_reopened && content) {
      try {
        const ai_result = await this.chat_ai_service.summarize_and_classify(
          content,
          customer_name,
          phone_number,
        );
        summary = ai_result.summary;
        suggested_team = ai_result.suggested_team;
      } catch (err) {
        this.logger.error('AI classification failed', err);
      }
    }

    // Insert chat message
    const { data: inserted_msg, error: msg_error } = await client
      .from('chat_messages')
      .insert({
        conversation_id: conversation.id,
        interakt_message_id,
        direction: 'inbound',
        message_type,
        content,
        media_url,
        sender_type: 'customer',
        sender_name: customer_name,
        summary,
        suggested_team,
      })
      .select()
      .single();

    if (msg_error || !inserted_msg) {
      this.logger.error('Failed to insert chat message', msg_error);
      return;
    }

    // Update conversation metadata
    const conv_update: Record<string, unknown> = {
      last_message_at: new Date().toISOString(),
      unread_count: (conversation.unread_count || 0) + 1,
      updated_at: new Date().toISOString(),
    };

    if (customer_name && !conversation.customer_name) {
      conv_update.customer_name = customer_name;
    }

    if (suggested_team) {
      conv_update.assigned_team = suggested_team;
    }

    const { data: updated_conv } = await client
      .from('conversations')
      .update(conv_update)
      .eq('id', conversation.id)
      .select()
      .single();

    // WebSocket events
    const msg_dto = inserted_msg as unknown as ChatMessageResponseDto;
    this.chat_gateway.emit_new_message(msg_dto);
    this.chat_gateway.emit_new_message_to_conversation(
      conversation.id,
      msg_dto,
    );

    if (updated_conv) {
      this.chat_gateway.emit_conversation_updated(
        updated_conv as unknown as ConversationResponseDto,
      );
    }

    this.logger.log(
      `Processed inbound message for conversation ${conversation.id}`,
    );
  }

  // --- Agent Reply ---

  async send_reply(
    conversation_id: string,
    dto: SendMessageDto,
  ): Promise<ChatMessageResponseDto> {
    const client = this.supabase_service.getClient();

    const { data: conversation, error: fetch_error } = await client
      .from('conversations')
      .select('*')
      .eq('id', conversation_id)
      .single();

    if (fetch_error || !conversation) {
      throw new NotFoundException(
        `Conversation ${conversation_id} not found`,
      );
    }

    const conv = conversation as ConversationRecord;

    // Send via Interakt API
    const send_result = await this.interakt_service.send_message(
      conv.phone_number,
      dto.content,
    );

    if (!send_result.success) {
      this.logger.error(
        `Failed to send reply to ${conv.phone_number}: ${send_result.error}`,
      );
      throw new Error(`Failed to send message: ${send_result.error}`);
    }

    // Insert outbound message record
    const { data: inserted_msg, error: msg_error } = await client
      .from('chat_messages')
      .insert({
        conversation_id,
        direction: 'outbound',
        message_type: 'text',
        content: dto.content,
        sender_type: 'agent',
        sender_name: dto.agent_name || null,
        agent_id: dto.agent_id || null,
      })
      .select()
      .single();

    if (msg_error || !inserted_msg) {
      this.logger.error('Failed to insert outbound message', msg_error);
      throw new Error('Message sent but failed to save record');
    }

    // Update conversation last_message_at
    await client
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversation_id);

    // WebSocket events
    const msg_dto = inserted_msg as unknown as ChatMessageResponseDto;
    this.chat_gateway.emit_new_message(msg_dto);
    this.chat_gateway.emit_new_message_to_conversation(
      conversation_id,
      msg_dto,
    );

    return msg_dto;
  }

  // --- Conversation CRUD ---

  async get_conversations(
    dto: GetConversationsDto,
  ): Promise<{ data: ConversationResponseDto[]; total: number }> {
    const client = this.supabase_service.getClient();
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const offset = (page - 1) * limit;

    let query = client
      .from('conversations')
      .select('*', { count: 'exact' })
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (dto.status) {
      query = query.eq('status', dto.status);
    }

    if (dto.team) {
      query = query.eq('assigned_team', dto.team);
    }

    const { data, error, count } = await query;

    if (error) {
      this.logger.error('Failed to fetch conversations', error);
      throw new Error('Failed to fetch conversations');
    }

    return {
      data: (data as ConversationRecord[]) as unknown as ConversationResponseDto[],
      total: count || 0,
    };
  }

  async get_conversation(id: string): Promise<ConversationResponseDto> {
    const { data, error } = await this.supabase_service
      .getClient()
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException(`Conversation ${id} not found`);
    }

    return data as unknown as ConversationResponseDto;
  }

  async update_conversation(
    id: string,
    dto: UpdateConversationDto,
  ): Promise<ConversationResponseDto> {
    const client = this.supabase_service.getClient();

    const { data: existing, error: fetch_error } = await client
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetch_error || !existing) {
      throw new NotFoundException(`Conversation ${id} not found`);
    }

    const update_data: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.status !== undefined) update_data.status = dto.status;
    if (dto.assigned_team !== undefined)
      update_data.assigned_team = dto.assigned_team;
    if (dto.assigned_agent !== undefined)
      update_data.assigned_agent = dto.assigned_agent;

    const { data: updated, error: update_error } = await client
      .from('conversations')
      .update(update_data)
      .eq('id', id)
      .select()
      .single();

    if (update_error || !updated) {
      throw new Error('Failed to update conversation');
    }

    const conv_dto = updated as unknown as ConversationResponseDto;
    this.chat_gateway.emit_conversation_updated(conv_dto);

    return conv_dto;
  }

  // --- Messages ---

  async get_messages(
    conversation_id: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ data: ChatMessageResponseDto[]; total: number }> {
    const client = this.supabase_service.getClient();
    const offset = (page - 1) * limit;

    // Verify conversation exists
    const { data: conv, error: conv_error } = await client
      .from('conversations')
      .select('id')
      .eq('id', conversation_id)
      .single();

    if (conv_error || !conv) {
      throw new NotFoundException(
        `Conversation ${conversation_id} not found`,
      );
    }

    const { data, error, count } = await client
      .from('chat_messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      this.logger.error('Failed to fetch messages', error);
      throw new Error('Failed to fetch messages');
    }

    return {
      data: (data as ChatMessageRecord[]) as unknown as ChatMessageResponseDto[],
      total: count || 0,
    };
  }

  async mark_message_read(message_id: string): Promise<ChatMessageResponseDto> {
    const client = this.supabase_service.getClient();

    const { data: message, error: fetch_error } = await client
      .from('chat_messages')
      .select('*')
      .eq('id', message_id)
      .single();

    if (fetch_error || !message) {
      throw new NotFoundException(`Message ${message_id} not found`);
    }

    if (message.is_read) {
      return message as unknown as ChatMessageResponseDto;
    }

    const { data: updated, error: update_error } = await client
      .from('chat_messages')
      .update({ is_read: true })
      .eq('id', message_id)
      .select()
      .single();

    if (update_error || !updated) {
      throw new Error('Failed to mark message as read');
    }

    // Decrement unread_count on conversation
    const { data: conv } = await client
      .from('conversations')
      .select('unread_count')
      .eq('id', message.conversation_id)
      .single();

    if (conv && conv.unread_count > 0) {
      await client
        .from('conversations')
        .update({
          unread_count: conv.unread_count - 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', message.conversation_id);
    }

    return updated as unknown as ChatMessageResponseDto;
  }

  // --- Helpers ---

  private normalize_message_type(
    type: string | undefined,
  ): 'text' | 'image' | 'document' | 'audio' | 'video' {
    const valid = ['text', 'image', 'document', 'audio', 'video'] as const;
    const lower = (type || 'text').toLowerCase();
    return valid.includes(lower as (typeof valid)[number])
      ? (lower as (typeof valid)[number])
      : 'text';
  }
}
