import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import {
  AuthResponseDto,
  AuthTokens,
  JwtPayload,
  Role,
  UserEntity,
  UserProfile,
} from '@smartfeed/shared';
import type { SignOptions } from 'jsonwebtoken';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CreateUserCommand } from '../users/commands/create-user.command';
import { GetUserByEmailQuery } from '../users/queries/get-user-by-email.query';
import { GetUserByIdQuery } from '../users/queries/get-user-by-id.query';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new user by dispatching CreateUserCommand via CommandBus.
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    this.logger.log(`Registering user with email: ${dto.email}`);

    // Delegate creation & password hashing to UsersModule through CommandBus
    const user = await this.commandBus.execute<CreateUserCommand, UserProfile>(
      new CreateUserCommand(dto.email, dto.password, dto.fullName, dto.role),
    );

    const tokens = await this.generateTokens(user);

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

    // Query user data strictly through QueryBus
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

    const userProfile: UserProfile = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const tokens = await this.generateTokens(userProfile);

    return {
      user: userProfile,
      tokens,
    };
  }

  /**
   * Refresh access & refresh tokens.
   */
  async refreshToken(token: string): Promise<AuthResponseDto> {
    try {
      const refreshSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        'super-secret-refresh-token-key-change-in-production';

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: refreshSecret,
      });

      // Verify user existence and active status via QueryBus
      const user = await this.queryBus.execute<GetUserByIdQuery, UserProfile>(
        new GetUserByIdQuery(payload.sub),
      );

      const tokens = await this.generateTokens(user);

      return {
        user,
        tokens,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Issue JWT access and refresh token pair.
   */
  private async generateTokens(user: {
    id: string;
    email: string;
    role: Role;
  }): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'super-secret-access-token-key-change-in-production';
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'super-secret-refresh-token-key-change-in-production';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRATION') ||
          '15m') as SignOptions['expiresIn'],
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRATION') ||
          '7d') as SignOptions['expiresIn'],
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }
}
