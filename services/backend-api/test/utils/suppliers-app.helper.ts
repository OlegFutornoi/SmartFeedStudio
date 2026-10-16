import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { Role } from '@smartfeed/shared';
import { cleanDatabase } from '@test/utils/teardown.helper';

export interface SuppliersTestContext {
  app: INestApplication;
  prisma: PrismaService;
  timestamp: number;
  userToken: string;
  user2Token: string;
  teardown: () => Promise<void>;
}

/**
 * Boots the full Nest app against the real database and registers two isolated users
 * (`<prefix>1+…` and `<prefix>2+…`) for multi-tenant assertions.
 * Each spec passes a distinct prefix so parallel specs never clean each other's rows.
 */
export async function bootstrapSuppliersTestContext(prefix: string): Promise<SuppliersTestContext> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  const prisma = moduleFixture.get<PrismaService>(PrismaService);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.init();

  const emailPrefixes = [`${prefix}1+`, `${prefix}2+`];
  await cleanDatabase(prisma, { emailPrefixes });

  const timestamp = Date.now();
  const createdEmails: string[] = [];

  const register = async (slot: 1 | 2): Promise<string> => {
    const email = `${prefix}${slot}+${timestamp}@smartfeed.local`;
    createdEmails.push(email);
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'UserPassword123!',
        fullName: `Supplier Test User ${slot}`,
        role: Role.USER,
      });
    return res.body.tokens.accessToken as string;
  };

  const userToken = await register(1);
  const user2Token = await register(2);

  return {
    app,
    prisma,
    timestamp,
    userToken,
    user2Token,
    teardown: async () => {
      await cleanDatabase(prisma, { userEmails: createdEmails, emailPrefixes });
      await app.close();
    },
  };
}
