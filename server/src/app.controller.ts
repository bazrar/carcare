import { Controller, Get, Render } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Get('api/tos')
  @Render('tos.hbs')
  tos() {
    return {};
  }

  @Get('api/eul')
  @Render('eul.hbs')
  eul() {
    return {};
  }

  @Get()
  @Render('index.hbs')
  root() {
    return { message: 'Hello world!' };
  }
}
