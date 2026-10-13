import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { SignOptions } from 'jsonwebtoken';
import { AuthTokens, JwtPayload, Role } from '@smartfeed/shared';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Issue JWT access and refresh token pair.
   */
  async generateTokens(user: { id: string; email: string; role: Role }): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessExpiration = (this.configService.get<string>('JWT_ACCESS_EXPIRATION') ||
      '30d') as SignOptions['expiresIn'];
    const expiresInSeconds = 30 * 24 * 60 * 60; // 30 days session

    const accessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'super-secret-access-token-key-change-in-production';
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'super-secret-refresh-token-key-change-in-production';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpiration,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRATION') ||
          '30d') as SignOptions['expiresIn'],
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: expiresInSeconds,
    };
  }

  /**
   * Verify refresh token and return decoded payload.
   */
  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'super-secret-refresh-token-key-change-in-production';

    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Generate signed password reset token.
   */
  async generatePasswordResetToken(user: { id: string; email: string }): Promise<string> {
    const resetSecret =
      this.configService.get<string>('JWT_RESET_SECRET') ||
      this.configService.get<string>('JWT_ACCESS_SECRET');

    if (!resetSecret && process.env.NODE_ENV === 'production') {
      throw new InternalServerErrorException('JWT secret is not configured in production');
    }

    const secretToUse = resetSecret || 'super-secret-reset-token-key-change-in-production';

    return this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        purpose: 'reset-password',
      },
      {
        secret: secretToUse,
        expiresIn: '1h',
      },
    );
  }

  /**
   * Verify password reset token and return decoded payload.
   */
  async verifyPasswordResetToken(token: string): Promise<{ sub: string; email: string }> {
    const resetSecret =
      this.configService.get<string>('JWT_RESET_SECRET') ||
      this.configService.get<string>('JWT_ACCESS_SECRET');

    if (!resetSecret && process.env.NODE_ENV === 'production') {
      throw new InternalServerErrorException('JWT secret is not configured in production');
    }

    const secretToUse = resetSecret || 'super-secret-reset-token-key-change-in-production';

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
        purpose?: string;
      }>(token, {
        secret: secretToUse,
      });

      if (payload.purpose !== 'reset-password') {
        throw new BadRequestException('Invalid reset token purpose');
      }

      return payload;
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException('Invalid or expired reset token');
    }
  }
}
