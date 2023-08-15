import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../jwt-payload.interface';
import { User } from '../../user/schemas/auth.schema';
import { Request } from 'express';
@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'refresh-token',
) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'refresh-token',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<any> {
    // console.log(
    //   '🚀 ~ file: refresh-token.strategy.ts ~ line 23 ~ validate ~ payload',
    //   payload,
    // );
    // const refreshToken = req.get('authorization').replace('Bearer', '').trim();
    // console.log(
    //   '🚀 ~ file: refresh-token.strategy.ts ~ line 37 ~ validate ~ refreshToken',
    //   refreshToken,
    // );
    // return {
    //   ...payload,
    //   refreshToken,
    // };
    const { userId } = payload;
    const user = await this.authService.findOneById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
