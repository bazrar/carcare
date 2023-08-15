import { Logger, UseGuards } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WashRequestService } from 'src/wash-request/wash-request.service';
import { JwtService } from '@nestjs/jwt';
import { ThrottlerGuard } from '@nestjs/throttler';

@WebSocketGateway({ namespace: 'location' })
export class LocationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger: Logger = new Logger('Location Gateway');
  @WebSocketServer() server: Server;
  constructor(
    private readonly washRequestService: WashRequestService,
    private readonly jwtService: JwtService,
  ) {}

  @UseGuards(ThrottlerGuard)
  handleDisconnect(client: any) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(ThrottlerGuard)
  handleConnection(client: any) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  @UseGuards(ThrottlerGuard)
  afterInit(server: any) {
    this.logger.log(`Initialized`);
  }

  @SubscribeMessage('join-room')
  @UseGuards(ThrottlerGuard)
  async handleJoinRoom(
    client: Socket,
    data: {
      room: string;
    },
  ) {
    // const providerId = await this.getUserIdFromToken(client.handshake.headers.authorization);
    //room is washRequestId
    const washRequest = await this.washRequestService.findWashRequestByParams({
      _id: data.room,
      // provider: providerId,
    });
    if (!washRequest || !(washRequest.status === 'confirmed')) {
      client.emit('error-type-provider', {
        message: 'Cannot process wash-request',
        status: washRequest?.status || 'Not found',
      });
    } else {
      client.join(data.room);
      client.emit('joined-room', data.room);
    }
  }

  @SubscribeMessage('share-location')
  @UseGuards(ThrottlerGuard)
  async handleShareLocation(
    client: Socket,
    data: {
      room: string;
      location: {
        latitude: string;
        longitude: string;
      };
    },
  ) {
    // const providerId = await this.getUserIdFromToken(client.handshake.headers.authorization);
    const washRequest = await this.washRequestService.findWashRequestByParams({
      _id: data.room,
      // provider: providerId,
    });
    if (!washRequest || !(washRequest.status === 'confirmed')) {
      client.emit('error-type-provider', {
        message: 'Cannot process wash-request',
        status: washRequest?.status || 'Not found',
      });
    } else {
      client.join(data.room);
      client.to(data.room).emit('current-location', data.location);
    }
  }

  @SubscribeMessage('request-provider-location')
  @UseGuards(ThrottlerGuard)
  async handleRequestLocation(
    client: Socket,
    data: {
      room: string;
    },
  ) {
    const userId = await this.getUserIdFromToken(
      client.handshake.headers.authorization,
    );
    const washRequest = await this.washRequestService.findWashRequestByParams({
      _id: data.room,
      userId,
    });
    if (!washRequest || !(washRequest.status === 'confirmed')) {
      client.emit('error-type-seeker', {
        message: 'Cannot process wash-request',
        status: washRequest?.status || 'Not found',
      });
    } else {
      client.join(data.room);
      client.to(data.room).emit('view-location', data.room);
    }
  }

  @SubscribeMessage('leave-room')
  @UseGuards(ThrottlerGuard)
  async handleLeaveRoom(
    client: Socket,
    data: {
      room: string;
    },
  ) {
    const userId = this.getUserIdFromToken(
      client.handshake.headers.authorization,
    );
    const washRequest = await this.washRequestService.findWashRequestByParams({
      _id: data.room,
      userId,
    });
    if (!washRequest || !(washRequest.status === 'confirmed')) {
      client.emit('error-type-provider', {
        message: 'Cannot process wash-request',
        status: washRequest?.status || 'Not found',
      });
    } else {
      client.leave(data.room);
      client.emit('left-room', data.room);
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
