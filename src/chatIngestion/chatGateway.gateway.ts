import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatMessageResponseDto } from './dto/chatMessageResponse.dto.js';
import { ConversationResponseDto } from './dto/conversationResponse.dto.js';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chats',
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  handleConnection(client: Socket): void {
    this.logger.log(`Chat client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Chat client disconnected: ${client.id}`);
  }

  emit_new_message(message: ChatMessageResponseDto): void {
    this.server.emit('new_message', message);
    this.logger.log(
      `Broadcast new_message for conversation ${message.conversation_id}`,
    );
  }

  emit_new_message_to_conversation(
    conversation_id: string,
    message: ChatMessageResponseDto,
  ): void {
    this.server
      .to(`conversation_${conversation_id}`)
      .emit('new_message', message);
  }

  emit_conversation_updated(conversation: ConversationResponseDto): void {
    this.server.emit('conversation_updated', conversation);
    this.logger.log(`Broadcast conversation_updated: ${conversation.id}`);
  }

  @SubscribeMessage('join_conversation')
  handle_join_conversation(
    client: Socket,
    payload: { conversation_id: string },
  ): void {
    client.join(`conversation_${payload.conversation_id}`);
    this.logger.log(
      `Client ${client.id} joined conversation_${payload.conversation_id}`,
    );
  }

  @SubscribeMessage('leave_conversation')
  handle_leave_conversation(
    client: Socket,
    payload: { conversation_id: string },
  ): void {
    client.leave(`conversation_${payload.conversation_id}`);
    this.logger.log(
      `Client ${client.id} left conversation_${payload.conversation_id}`,
    );
  }
}
