import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { LicensesModule } from './modules/licenses/licenses.module';
import { PlansModule } from './modules/plans/plans.module';
import { StorageModule } from './modules/storage/storage.module';
import { NavigationModule } from './modules/navigation/navigation.module';
import { MailModule } from './modules/mail/mail.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { ProductsModule } from './modules/products/products.module';
import { FeedsModule } from './modules/feeds/feeds.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Global Rate Limiting (100 req/min in production, elevated in test mode)
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isTest =
          configService.get<string>('NODE_ENV') === 'test' || process.env.NODE_ENV === 'test';
        return [
          {
            name: 'default',
            ttl: 60000,
            limit: isTest ? 50000 : 100,
          },
        ];
      },
      inject: [ConfigService],
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

    // Global Infrastructure Modules
    MailModule,

    // Domain Modules
    UsersModule,
    AuthModule,
    OrganizationsModule,
    LicensesModule,
    PlansModule,
    StorageModule,
    NavigationModule,
    PaymentsModule,
    SuppliersModule,
    ProductsModule,
    FeedsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
