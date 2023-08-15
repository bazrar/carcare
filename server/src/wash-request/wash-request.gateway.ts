import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ namespace: 'washrequest' })
export class WashRequestGateWay
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger: Logger = new Logger('Location Gateway');
  @WebSocketServer() server: Server;
  constructor(private readonly jwtService: JwtService) {}
  handleDisconnect(client: any) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }
  handleConnection(client: any) {
    this.logger.log(`Client connected: ${client.id}`);
  }
  afterInit(server: any) {
    this.logger.log(`Initialized`);
  }

  @SubscribeMessage('join')
  async handleJoinRoom(client: Socket) {
    const userId = await this.getUserIdFromToken(
      client.handshake.headers.authorization,
    );
    client.data.userId = userId;
    console.log('Joining wash request room');
    client.join(`washrequest`);
    return {
      status: 'true',
      message: 'successfully joined room',
    };
  }

  async notifyWashRequestStatus(
    userId: string,
    washRequestId: string,
    status: string,
  ) {
    const sockets = await this.server.local.to('washrequest').fetchSockets();
    const userSockets = sockets.filter(
      (socket) => socket.data.userId === userId,
    );
    console.log('userSockets', userSockets);
    if (userSockets) {
      userSockets.forEach((socket) =>
        socket.emit('washrequest', { washRequestId, status }),
      );
    } else {
      console.log('No sockets');
    }
  }

  async getUserIdFromToken(webToken: string) {
    try {
      const decodedToken: any = await this.jwtService.decode(webToken);
      return decodedToken.userId;
    } catch (error) {
      return 'Unauthorized request';
    }
  }
}
