import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { QueryBus } from '@nestjs/cqrs';
import { JwtPayload, UserProfile, AuthErrorCode, Role } from '@smartfeed/shared';
import { GetUserByIdQuery } from '@/modules/users/queries/get-user-by-id.query';
import { RedisCacheService } from '@/common/cache/redis-cache.service';

interface CachedAuthUser {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly queryBus: QueryBus,
    private readonly cacheService: RedisCacheService,
  ) {
    const secretOrKey = configService.get<string>('JWT_ACCESS_SECRET');
    if (!secretOrKey) {
      throw new InternalServerErrorException(
        'Critical configuration missing: JWT_ACCESS_SECRET must be defined',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey,
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Check if token was issued prior to password reset or account suspension
    if (payload.iat) {
      const revokedBefore = await this.cacheService.get<number>(
        `auth:revoked_before:${payload.sub}`,
      );
      if (revokedBefore && payload.iat < revokedBefore) {
        throw new UnauthorizedException(
          'Authentication token has been revoked due to credential change. Please sign in again.',
        );
      }
    }

    const cacheKey = `auth:user:${payload.sub}`;

    // Fast-path: Check Redis cache (60s TTL) to eliminate per-request DB hits
    const cachedUser = await this.cacheService.get<CachedAuthUser>(cacheKey);
    if (cachedUser) {
      if (cachedUser.isActive === false) {
        throw new ForbiddenException({
          code: AuthErrorCode.USER_SUSPENDED,
          message: 'User account has been suspended by administration. Please contact support.',
        });
      }
      return {
        id: cachedUser.id,
        email: cachedUser.email,
        role: cachedUser.role,
      };
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

      // Populate 60-second cache
      await this.cacheService.set(
        cacheKey,
        {
          id: user.id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        },
        60,
      );

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
