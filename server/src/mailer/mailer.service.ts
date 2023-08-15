import * as path from 'path';
import * as hbs from 'nodemailer-express-handlebars';
import { createTransport, Transporter } from 'nodemailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import Mail from 'nodemailer/lib/mailer';

@Injectable()
export class MailerService {
  transporter: Transporter<SMTPTransport.SentMessageInfo>;
  constructor(private readonly configService: ConfigService) {
    const user = this.configService.get<string>('NODEMAILER_USER');
    const pass = this.configService.get<string>('NODEMAILEER_PASS');
    console.log(
      '🚀 ~ file: mailer.service.ts ~ line 13 ~ MailerService ~ constructor ~ pass',
      user,
      pass,
    );
    this.transporter = createTransport({
      service: 'gmail',
      auth: {
        user,
        pass: this.configService.get<string>('NODEMAILEER_PASS'),
      },
    });
  }
  async sendMail(options: Mail.Options) {
    await this.transporter.sendMail(options);
  }

  async sendServiceManagerRegistrationMail(
    to: Array<string>,
    company: string,
    redirectURL: string,
  ) {
    console.log(__dirname, 'dirname is');
    console.log(path.join(__dirname, '..', '..', 'mailer', 'templates'));
    const emailPath = path.join(__dirname, '..', '..', 'mailer', 'templates');
    const handlebarOptions = {
      viewEngine: {
        partialsDir: emailPath,
        defaultLayout: false,
      },
      viewPath: emailPath,
    };
    this.transporter.use('compile', hbs(handlebarOptions));
    const mailOptions = {
      from: `"Carwash" ${this.configService.get<string>('NODEMAILER_USER')}`, // sender address
      to: to.join(','), // list of receivers
      subject: 'Registration',
      template: 'service-manager-registration-email', // the name of the template file i.e email.handlebars
      context: {
        // name: 'Adebola', // replaces {{name}} with Adebola in template
        company: company, // replaces {{company}} with {{company}} in template
        redirectURL: redirectURL,
      },
    };
    await this.sendMail(mailOptions);
  }
}
