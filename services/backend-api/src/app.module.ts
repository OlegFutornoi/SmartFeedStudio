import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { LicensesModule } from './modules/licenses/licenses.module';
import { PlansModule } from './modules/plans/plans.module';
import { StorageModule } from './modules/storage/storage.module';
import { NavigationModule } from './modules/navigation/navigation.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Global CQRS Event & Command Bus
    CqrsModule.forRoot(),

    // Redis & BullMQ Queue Integration
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
        },
      }),
      inject: [ConfigService],
    }),

    // Database
    PrismaModule,

    // Domain Modules
    UsersModule,
    AuthModule,
    LicensesModule,
    PlansModule,
    StorageModule,
    NavigationModule,
  ],
})
export class AppModule {}
