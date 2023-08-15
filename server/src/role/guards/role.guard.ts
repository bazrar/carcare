import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { User } from 'src/user/schemas/auth.schema';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());

    console.log(
      '🚀 ~ file: role.guard.ts ~ line 14 ~ RoleGuard ~ roles',
      roles,
    );
    if (!roles) {
      return false;
    }
    const request = context.switchToHttp().getRequest();
    console.dir(request.originalUrl); // '/admin/new?a=b' (WARNING: beware query string)
    console.dir(request.baseUrl); // '/admin'
    console.dir(request.path); // '/new'
    console.dir(request.baseUrl + request.path);
    console.log('*******Req Headers*******');
    console.log(JSON.stringify(request?.headers));
    const user: User = request.user;
    if (!user || !user.role) {
      console.log('*****User without role***', user);
      return false;
    }
    console.log('*****User with role***', user);
    console.log('User role', user.role);
    console.log(
      '🚀 ~ file: role.guard.ts ~ line 20 ~ RoleGuard ~ user.role',
      user.role,
    );
    return roles.includes(user.role);
  }
}
