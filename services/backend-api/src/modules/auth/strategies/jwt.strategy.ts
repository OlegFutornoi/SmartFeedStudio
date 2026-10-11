import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { QueryBus } from '@nestjs/cqrs';
import { JwtPayload, UserProfile, AuthErrorCode } from '@smartfeed/shared';
import { GetUserByIdQuery } from '@/modules/users/queries/get-user-by-id.query';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly queryBus: QueryBus,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_ACCESS_SECRET') ||
        'super-secret-access-token-key-change-in-production',
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    try {
      const user = await this.queryBus.execute<GetUserByIdQuery, UserProfile>(
        new GetUserByIdQuery(payload.sub),
      );

      if (!user) {
        throw new UnauthorizedException('User account no longer exists');
      }

      if (user.isActive === false) {
        throw new ForbiddenException({
          code: AuthErrorCode.USER_SUSPENDED,
          message: 'User account has been suspended by administration. Please contact support.',
        });
      }

      return {
        id: user.id,
        email: user.email,
        role: user.role,
      };
    } catch (err: unknown) {
      if (err instanceof UnauthorizedException || err instanceof ForbiddenException) {
        throw err;
      }
      throw new UnauthorizedException('Authentication token is missing or invalid');
    }
  }
}
