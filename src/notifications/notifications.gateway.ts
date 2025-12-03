/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
// Socket.IO types are not fully compatible with TypeScript strict mode
import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { JWT_PURPOSE } from '../common/constants/jwt-purpose.constant.js';
import { AppJwtService } from '../jwt/jwt.service.js';

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL?.split(',').map(url => url.trim()) || '*',
    credentials: true,
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  public server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  // Map to store userId -> socketId(s)
  private readonly userSockets = new Map<number, Set<string>>();

  public constructor(private readonly jwtService: AppJwtService) {}

  public async handleConnection(client: Socket): Promise<void> {
    try {
      const token = (client.handshake.auth?.token ||
        client.handshake.query?.token) as string | undefined;

      if (!token) {
        this.logger.warn(`Client ${client.id} tried to connect without token`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verify(token, JWT_PURPOSE.SESSION);
      const userId = payload.sub;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)?.add(client.id);

      // Store userId in socket data for easy access on disconnect
      client.data.userId = userId as number;

      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Connection unauthorized: ${message}`);
      client.disconnect();
    }
  }

  public handleDisconnect(client: Socket): void {
    const userId = client.data.userId as number | undefined;
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)?.delete(client.id);
      if (this.userSockets.get(userId)?.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  public sendNotificationToUser(userId: number, payload: unknown): void {
    const socketIds = this.userSockets.get(userId);
    if (socketIds) {
      socketIds.forEach((socketId) => {
        this.server.to(socketId).emit('notification', payload);
      });
      this.logger.log(`Notification sent to user ${userId}`);
    } else {
      this.logger.debug(`User ${userId} is not connected`);
    }
  }
}
