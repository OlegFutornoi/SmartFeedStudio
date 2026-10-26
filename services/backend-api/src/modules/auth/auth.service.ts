import { Injectable, UnauthorizedException, ForbiddenException, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import {
  AuthErrorCode,
  AuthResponseDto,
  ForgotPasswordResponseDto,
  ResetPasswordResponseDto,
  Role,
  UserEntity,
  UserProfile,
} from '@smartfeed/shared';

import { RegisterDto } from '@/modules/auth/dto/register.dto';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { ForgotPasswordDto } from '@/modules/auth/dto/forgot-password.dto';
import { ResetPasswordDto } from '@/modules/auth/dto/reset-password.dto';
import { TokenService } from '@/modules/auth/services/token.service';
import { RedisCacheService } from '@/common/cache/redis-cache.service';
import { CreateUserCommand } from '@/modules/users/commands/create-user.command';
import { ResetPasswordCommand } from '@/modules/users/commands/reset-password.command';
import { GetUserByEmailQuery } from '@/modules/users/queries/get-user-by-email.query';
import { GetUserByIdQuery } from '@/modules/users/queries/get-user-by-id.query';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly tokenService: TokenService,
    private readonly cacheService: RedisCacheService,
  ) {}

  /**
   * Register a new user by dispatching CreateUserCommand via CommandBus.
   * Security defense: Public registration always forces Role.USER to prevent Privilege Escalation.
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    this.logger.log(`Registering user with email: ${dto.email}`);

    const user = await this.commandBus.execute<CreateUserCommand, UserProfile>(
      new CreateUserCommand(dto.email, dto.password, dto.fullName, Role.USER, dto.companyName),
    );

    const tokens = await this.tokenService.generateTokens(user);

    return {
      user,
      tokens,
    };
  }

  /**
   * Authenticate user by fetching user data via QueryBus and verifying password.
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log(`Authenticating user with email: ${dto.email}`);

    const user = await this.queryBus.execute<GetUserByEmailQuery, UserEntity | null>(
      new GetUserByEmailQuery(dto.email),
    );

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const userProfile = await this.queryBus.execute<GetUserByIdQuery, UserProfile>(
      new GetUserByIdQuery(user.id),
    );

    if (userProfile.isActive === false) {
      throw new ForbiddenException({
        code: AuthErrorCode.USER_SUSPENDED,
        message: 'User account has been suspended by administration. Please contact support.',
      });
    }

    const tokens = await this.tokenService.generateTokens(userProfile);

    return {
      user: userProfile,
      tokens,
    };
  }

  /**
   * Refresh access & refresh tokens.
   */
  async refreshToken(token: string): Promise<AuthResponseDto> {
    const payload = await this.tokenService.verifyRefreshToken(token);

    const user = await this.queryBus.execute<GetUserByIdQuery, UserProfile>(
      new GetUserByIdQuery(payload.sub),
    );

    if (!user || user.isActive === false) {
      throw new ForbiddenException({
        code: AuthErrorCode.USER_SUSPENDED,
        message: 'User account has been suspended by administration. Please contact support.',
      });
    }

    const tokens = await this.tokenService.generateTokens(user);

    return {
      user,
      tokens,
    };
  }

  /**
   * Request password reset token for given email.
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<ForgotPasswordResponseDto> {
    this.logger.log(`Password reset requested for email: ${dto.email}`);

    const user = await this.queryBus.execute<GetUserByEmailQuery, UserEntity | null>(
      new GetUserByEmailQuery(dto.email),
    );

    if (!user) {
      // Prevent email enumeration
      return {
        success: true,
        message: 'If this email is registered, password reset instructions have been sent.',
      };
    }

    const resetToken = await this.tokenService.generatePasswordResetToken(user);
    const isTestEnvironment = process.env.NODE_ENV === 'test';

    return {
      success: true,
      message: 'If this email is registered, password reset instructions have been sent.',
      ...(isTestEnvironment ? { resetToken } : {}),
    };
  }

  /**
   * Reset user password using verified reset token.
   */
  async resetPassword(dto: ResetPasswordDto): Promise<ResetPasswordResponseDto> {
    const payload = await this.tokenService.verifyPasswordResetToken(dto.token);

    await this.commandBus.execute(new ResetPasswordCommand(payload.sub, dto.newPassword));

    return {
      success: true,
      message: 'Password has been reset successfully',
    };
  }

  /**
   * Invalidate active session and revoke issued tokens.
   */
  async logout(userId: string, rawToken?: string): Promise<void> {
    this.logger.log(`Logging out user: ${userId}`);
    await this.cacheService.del(`auth:user:${userId}`);
    if (rawToken) {
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      await this.cacheService.set(`auth:blacklist:${tokenHash}`, true, 30 * 24 * 60 * 60);
    }
    const revocationTimestamp = Math.floor(Date.now() / 1000);
    await this.cacheService.set(
      `auth:revoked_before:${userId}`,
      revocationTimestamp,
      30 * 24 * 60 * 60, // 30 days
    );
  }
}
