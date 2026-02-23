import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EmailResponseDto } from '../gmailIngestion/dto/emailResponse.dto.js';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/emails',
})
export class EmailGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EmailGateway.name);

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emit_new_email(email: EmailResponseDto): void {
    this.server.emit('new_email', email);
    this.logger.log(`Broadcast new_email: ${email.message_id}`);
  }

  emit_new_email_to_inbox(
    support_email_id: string,
    email: EmailResponseDto,
  ): void {
    this.server.to(`inbox_${support_email_id}`).emit('new_email', email);
    this.logger.log(
      `Emitted new_email to inbox_${support_email_id}: ${email.message_id}`,
    );
  }

  @SubscribeMessage('join_inbox')
  handle_join_inbox(
    client: Socket,
    payload: { support_email_id: string },
  ): void {
    client.join(`inbox_${payload.support_email_id}`);
    this.logger.log(
      `Client ${client.id} joined inbox_${payload.support_email_id}`,
    );
  }

  @SubscribeMessage('leave_inbox')
  handle_leave_inbox(
    client: Socket,
    payload: { support_email_id: string },
  ): void {
    client.leave(`inbox_${payload.support_email_id}`);
    this.logger.log(
      `Client ${client.id} left inbox_${payload.support_email_id}`,
    );
  }
}
