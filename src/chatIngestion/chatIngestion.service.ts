import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service.js';
import { InteraktService } from './interakt.service.js';
import { NetcoreService } from './netcore.service.js';
import { ChatAiService } from './chatAi.service.js';
import { ChatGateway } from './chatGateway.gateway.js';
import { InteraktWebhookDto } from './dto/interaktWebhook.dto.js';
import { NetcoreWebhookDto } from './dto/netcoreWebhook.dto.js';
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
    private readonly netcore_service: NetcoreService,
    private readonly chat_ai_service: ChatAiService,
    private readonly chat_gateway: ChatGateway,
  ) {}

  // --- Webhook Processing ---

  async process_webhook(payload: InteraktWebhookDto): Promise<void> {
    switch (payload.type) {
      case 'message_received':
        return this.process_message_received(payload.data);
      case 'workflow_response_update':
        return this.process_workflow_response(payload.data);
      default:
        this.logger.log(`Ignoring webhook event type: ${payload.type}`);
    }
  }

  // --- Structure 1: message_received ---

  private async process_message_received(
    data: Record<string, unknown> | undefined,
  ): Promise<void> {
    const customer = data?.customer as Record<string, unknown> | undefined;
    const message = data?.message as Record<string, unknown> | undefined;

    if (!customer || !message) {
      this.logger.warn('message_received missing customer or message data');
      return;
    }

    // Build canonical phone: country_code (+91) + phone_number (9201053157)
    const raw_phone = customer.phone_number as string | undefined;
    const country_code = ((customer.country_code as string) || '').replace('+', '');
    if (!raw_phone) {
      this.logger.warn('message_received missing phone_number');
      return;
    }
    const phone_number = raw_phone.startsWith(country_code)
      ? raw_phone
      : `${country_code}${raw_phone}`;

    // Name is in traits.name
    const traits = customer.traits as Record<string, unknown> | undefined;
    const customer_name = (traits?.name as string) || null;

    const interakt_message_id = (message.id as string) || null;
    const message_content_type = (message.message_content_type as string) || 'Text';
    const message_type = this.map_content_type(message_content_type);
    const content = this.extract_message_text(
      message.message as string | undefined,
      message_content_type,
    );
    const media_url = (message.media_url as string) || null;

    await this.ingest_inbound_message({
      phone_number,
      customer_name,
      interakt_message_id,
      message_type,
      content,
      media_url,
    });
  }

  // --- Structure 2: workflow_response_update ---

  private async process_workflow_response(
    data: Record<string, unknown> | undefined,
  ): Promise<void> {
    if (!data) {
      this.logger.warn('workflow_response_update missing data');
      return;
    }

    const customer_name = (data.customer_name as string) || null;
    const raw_number = (data.customer_number as string) || '';
    const phone_number = raw_number.replace('+', '');

    if (!phone_number) {
      this.logger.warn('workflow_response_update missing customer_number');
      return;
    }

    const workflow_id = (data.id as string) || null;
    const steps = (data.data as Array<Record<string, unknown>>) || [];

    if (steps.length === 0) {
      this.logger.log('workflow_response_update has no steps, skipping');
      return;
    }

    // Build a combined text from all Q&A steps
    const qa_lines: string[] = [];
    const messages_to_insert: Array<{
      interakt_message_id: string | null;
      message_type: 'text' | 'image' | 'document' | 'audio' | 'video';
      content: string | null;
      media_url: string | null;
    }> = [];

    for (const step of steps) {
      const question = step.question as Record<string, unknown> | undefined;
      const answer = step.answer as Record<string, unknown> | undefined;

      if (!answer) continue;

      const answer_id = (answer.id as string) || null;
      const answer_text = (answer.message as string) || null;
      const answer_media_url = (answer.media_url as string) || null;
      const answer_content_type = (answer.message_content_type as string) || 'Text';
      const question_text = (question?.message as string) || '';

      // Build Q&A line for summary
      if (question_text) {
        const display_answer = answer_text || answer_content_type || 'media';
        qa_lines.push(`Q: ${question_text}\nA: ${display_answer}`);
      }

      messages_to_insert.push({
        interakt_message_id: answer_id
          ? `workflow_${workflow_id}_${answer_id}`
          : null,
        message_type: this.map_content_type(answer_content_type),
        content: answer_text,
        media_url: answer_media_url,
      });
    }

    if (messages_to_insert.length === 0) {
      this.logger.log('workflow_response_update no answers to process');
      return;
    }

    // Use the combined Q&A text for AI classification on the first message
    const combined_text = qa_lines.join('\n\n') || null;

    for (let i = 0; i < messages_to_insert.length; i++) {
      const msg = messages_to_insert[i];
      await this.ingest_inbound_message({
        phone_number,
        customer_name,
        interakt_message_id: msg.interakt_message_id,
        message_type: msg.message_type,
        content: msg.content,
        media_url: msg.media_url,
        // AI classify only on the first message of this batch
        ai_override_text: i === 0 ? combined_text : null,
      });
    }

    this.logger.log(
      `Processed workflow_response_update: ${messages_to_insert.length} answers from ${phone_number}`,
    );
  }

  // --- Netcore Webhook Processing ---

  async process_netcore_webhook(payload: NetcoreWebhookDto): Promise<void> {
    const messages = payload.incoming_message;
    if (!messages || messages.length === 0) {
      this.logger.log('Netcore webhook has no incoming_message, skipping');
      return;
    }

    for (const msg of messages) {
      const phone_number = (msg.from || '').replace('+', '');
      if (!phone_number) {
        this.logger.warn('Netcore message missing from field');
        continue;
      }

      const customer_name = msg.from_name || null;
      const external_message_id = msg.message_id || null;
      const message_type = this.map_content_type(msg.message_type || 'text');

      let content: string | null = null;
      let media_url: string | null = null;

      switch (msg.message_type) {
        case 'text':
          content = msg.text_type?.text || null;
          break;
        case 'image':
          media_url = msg.image_type?.url || null;
          content = msg.image_type?.caption || null;
          break;
        case 'document':
          media_url = msg.document_type?.url || null;
          content = msg.document_type?.caption || msg.document_type?.filename || null;
          break;
        default:
          content = msg.text_type?.text || null;
          break;
      }

      await this.ingest_inbound_message({
        phone_number,
        customer_name,
        external_message_id,
        message_type,
        content,
        media_url,
        channel: 'netcore',
      });
    }

    this.logger.log(
      `Processed Netcore webhook: ${messages.length} messages`,
    );
  }

  // --- Shared inbound message ingestion ---

  private async ingest_inbound_message(params: {
    phone_number: string;
    customer_name: string | null;
    interakt_message_id?: string | null;
    external_message_id?: string | null;
    message_type: 'text' | 'image' | 'document' | 'audio' | 'video';
    content: string | null;
    media_url: string | null;
    ai_override_text?: string | null;
    channel?: string;
  }): Promise<void> {
    const {
      phone_number,
      customer_name,
      message_type,
      content,
      media_url,
      ai_override_text,
      channel = 'interakt',
    } = params;

    // Use external_message_id if provided, fall back to interakt_message_id
    const dedup_id = params.external_message_id || params.interakt_message_id || null;

    const client = this.supabase_service.getClient();

    // Dedup by external_message_id (or interakt_message_id for legacy)
    if (dedup_id) {
      const { data: existing } = await client
        .from('chat_messages')
        .select('id')
        .or(`external_message_id.eq.${dedup_id},interakt_message_id.eq.${dedup_id}`)
        .limit(1)
        .maybeSingle();

      if (existing) {
        this.logger.log(`Duplicate message ignored: ${dedup_id}`);
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
      const { data: new_conv, error: insert_error } = await client
        .from('conversations')
        .insert({
          phone_number,
          customer_name,
          status: 'open',
          channel,
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
    const text_for_ai = ai_override_text !== undefined
      ? ai_override_text
      : content;

    if (is_new_or_reopened && text_for_ai) {
      try {
        const ai_result = await this.chat_ai_service.summarize_and_classify(
          text_for_ai,
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
        interakt_message_id: params.interakt_message_id || null,
        external_message_id: dedup_id,
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

  // --- Helpers: Interakt field mapping ---

  private extract_message_text(
    raw_message: string | undefined,
    content_type: string,
  ): string | null {
    if (!raw_message) return null;

    // Interactive types have JSON in the message field
    const interactive_types = [
      'InteractiveListReply',
      'InteractiveButtonReply',
    ];

    if (interactive_types.includes(content_type)) {
      try {
        const parsed = JSON.parse(raw_message);
        // list_reply: { title: "..." }, button_reply: { title: "..." }
        return (
          parsed?.list_reply?.title ||
          parsed?.button_reply?.title ||
          raw_message
        );
      } catch {
        return raw_message;
      }
    }

    return raw_message;
  }

  private map_content_type(
    content_type: string,
  ): 'text' | 'image' | 'document' | 'audio' | 'video' {
    const lower = content_type.toLowerCase();
    if (lower === 'image') return 'image';
    if (lower === 'document') return 'document';
    if (lower === 'audio') return 'audio';
    if (lower === 'video') return 'video';
    // Text, InteractiveListReply, InteractiveButtonReply, etc. → text
    return 'text';
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
    const channel = (conversation.channel as string) || 'interakt';

    // Send via the appropriate provider
    let send_result: { success: boolean; error?: string };

    if (channel === 'netcore') {
      send_result = await this.netcore_service.send_message(
        conv.phone_number,
        dto.content,
      );
    } else {
      send_result = await this.interakt_service.send_message(
        conv.phone_number,
        dto.content,
      );
    }

    if (!send_result.success) {
      this.logger.error(
        `Failed to send reply to ${conv.phone_number} via ${channel}: ${send_result.error}`,
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

}
