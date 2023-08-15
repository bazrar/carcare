import {
  Inject,
  UnauthorizedException,
  UseGuards,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ServiceStationService } from 'src/service-station/service-station.service';
import { Role } from 'src/user/enums/roles.enum';
import { UserService } from 'src/user/user.service';

@WebSocketGateway({
  namespace: 'location-tracking',
})
export class LocationTrackingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    @Inject(forwardRef(() => ServiceStationService))
    private readonly serviceStationService: ServiceStationService,
  ) {}

  afterInit(server: Server) {
    console.log('Socket gateway initialized');
  }

  @UseGuards(ThrottlerGuard)
  async handleConnection(client: Socket, ...args: any[]) {
    try {
      const user = await this.getUserFromToken(client.handshake.auth.token);

      if (!user || user?.role !== Role.SEEKER) {
        throw new UnauthorizedException('Unauthorized request');
      }

      const latitude = parseFloat(client.handshake.query.latitude as string);
      const longitude = parseFloat(client.handshake.query.longitude as string);

      const updatedUser =
        await this.userService.updateSeekerLocationTrackerDetails(
          user._id,
          client.id,
          {
            latitude,
            longitude,
          },
        );

      console.log(`Client connected:`, client.id, { args });
      console.log(
        '🚀 ~ file: location-tracking.gateway.ts:37 ~ handleJoinRoom ~ user:',
        updatedUser,
      );
      this.handleLocationUpdate({ latitude, longitude });
      return updatedUser;
    } catch (error) {
      client.emit('error', error);
      client.disconnect(true);
    }
  }

  @UseGuards(ThrottlerGuard)
  async handleDisconnect(client: Socket) {
    const user = await this.getUserFromToken(client.handshake.auth.token);
    if (!user && user?.role !== Role.SEEKER) {
      client.emit('error', new UnauthorizedException('Unauthorized request'));
      return;
    }
    const updatedUser =
      await this.userService.resetSeekerLocationTrackerDetails(user?._id);

    console.log(`Client disconnected: ${client?.id}`);
    return updatedUser;
  }

  @UseGuards(ThrottlerGuard)
  async handleLocationUpdate({
    latitude,
    longitude,
  }: {
    latitude: number;
    longitude: number;
  }) {
    console.log('SHARE LOCATION');
    const searchRadius = 10000; // in meters
    // refers to additional search radius beyond the service station radius
    const serviceStationBufferDistance = 1000;

    const seekers = await this.userService.searchSeekersByLocation(
      latitude,
      longitude,
      searchRadius + serviceStationBufferDistance,
    );
    const promises = [];
    seekers.forEach((seeker) => {
      promises.push(
        this.serviceStationService.searchServiceStationsWithinRadius(
          {
            latitude: seeker.location.coordinates[1],
            longitude: seeker.location.coordinates[0],
          },
          searchRadius,
        ),
      );
    });
    console.log(
      '🚀 ~ file: location-tracking.gateway.ts:104 ~ seekers.forEach ~ seekers:',
      seekers,
    );
    const stations = await Promise.all(promises);
    console.log(
      '🚀 ~ file: location-tracking.gateway.ts:109 ~ stations:',
      stations,
    );

    seekers.forEach((seeker, index) => {
      console.log(
        '🚀 ~ file: location-tracking.gateway.ts:120 ~ seekers.forEach ~ seeker.locationTrackerSocketId:',
        seeker.locationTrackerSocketId,
      );
      const station = stations[index];
      console.log(
        '🚀 ~ file: location-tracking.gateway.ts:120 ~ seekers.forEach ~ station:',
        station,
      );
      this.server
        .to(seeker.locationTrackerSocketId)
        .emit('service-stations', station);
    });
  }

  async getUserFromToken(webToken: string) {
    try {
      const decodedToken: any = this.jwtService.decode(webToken);
      return await this.userService.findUserById(decodedToken?.userId);
    } catch (error) {
      throw new UnauthorizedException('Unauthorized request');
    }
  }
}
