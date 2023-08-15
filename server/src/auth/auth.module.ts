import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccessTokenStrategy, RefreshTokenStrategy } from './strategies';
import { User, AuthSchema } from '../user/schemas/auth.schema';
import { RedisClientModule } from 'src/redis/redis.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { ServiceStationModule } from 'src/service-station/service-station.module';
import { SmsModule } from 'src/sms/sms.module';
import { BusinessModule } from 'src/business/business.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    MongooseModule.forFeature([{ name: User.name, schema: AuthSchema }]),
    ClientsModule.register([
      {
        name: 'OTP_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://rabbitmq:5672'],
          queue: 'otp_queue',
          noAck: false,
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
    RedisClientModule,
    ServiceStationModule,
    SmsModule,
    BusinessModule,
  ],
  exports: [
    AuthService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    PassportModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AccessTokenStrategy, RefreshTokenStrategy],
})
export class AuthModule {}
