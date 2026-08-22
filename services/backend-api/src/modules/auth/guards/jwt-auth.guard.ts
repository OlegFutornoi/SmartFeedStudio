import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(err: unknown, user: TUser, _info: unknown): TUser {
    if (err || !user) {
      throw (
        (err as Error) || new UnauthorizedException('Authentication token is missing or invalid')
      );
    }
    return user;
  }
}
