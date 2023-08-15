import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../jwt-payload.interface';
import { User } from '../../user/schemas/auth.schema';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(
  Strategy,
  'access-token',
) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'access-token',
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    console.log('-----access token strategy------');
    console.log(JSON.stringify(payload, null, 2));
    const { userId } = payload;
    const user = await this.authService.findOneById(userId);
    console.log('------access token user------');
    console.log(JSON.stringify(user, null, 2));
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
