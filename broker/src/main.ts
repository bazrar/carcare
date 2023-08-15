import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

const logger = new Logger('otp-queue');

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
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
  );
  await app
    .listen()
    .then(() => {
      console.log('running');
      logger.log(`Otp queue running`);
    })
    .catch((err) => console.error(err));
}
bootstrap();
