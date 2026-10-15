# 🏛 Backend Architecture & CQRS Patterns (SmartFeed Studio)

This reference document outlines the architectural patterns, NestJS CQRS structure, concurrency safety, and database guidelines for `services/backend-api`.

---

## 1. CQRS Pattern Architecture

SmartFeed Studio uses `@nestjs/cqrs` to decouple commands (write mutations), queries (read projections), and events (side effects).

```text
                  ┌──────────────────────┐
                  │    HTTP Controller   │
                  └──────────┬───────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   CommandBus.execute()              QueryBus.execute()
            │                                 │
            ▼                                 ▼
┌───────────────────────┐         ┌───────────────────────┐
│  CommandHandler (DTO) │         │  QueryHandler (Filter)│
└───────────┬───────────┘         └───────────┬───────────┘
            │                                 │
            ├───────────────┐                 │
            ▼               ▼                 ▼
   Prisma Mutation     EventBus.publish()  Prisma Query
                            │
                            ▼
                  EventHandler (Async Job / Queue)
```

### Module Isolation Rules:

- **`UsersModule`**: Data-access repository for `User`. Exposes `CreateUserCommandHandler`, `GetUserByEmailQueryHandler`.
- **`AuthModule`**: Handles auth tokens and login/register endpoints. Dispatches commands to `UsersModule`.
- **`LicensesModule`**: Subscribes to `UserCreatedEvent` to automatically generate `FREE` license keys.

---

## 2. 4-Layer Defense Implementation Example

```typescript
// Layer 1: DTO Validation
export class UpdateCatalogQuotaDto {
  @IsString()
  @IsNotEmpty()
  readonly catalogId!: string;

  @IsInt()
  @Min(1)
  @Max(1000000)
  readonly maxSkuLimit!: number;
}

// Layer 2: Domain / Quota Check in Handler
@CommandHandler(UpdateCatalogQuotaCommand)
export class UpdateCatalogQuotaHandler implements ICommandHandler<UpdateCatalogQuotaCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateCatalogQuotaCommand): Promise<void> {
    const license = await this.prisma.license.findUnique({
      where: { id: command.licenseId },
    });

    if (!license || !license.isActive) {
      throw new ForbiddenException('ACTIVE_LICENSE_REQUIRED');
    }

    if (command.maxSkuLimit > license.maxSkus) {
      throw new BadRequestException('EXCEEDS_PLAN_SKU_QUOTA');
    }

    // Layer 4: DB Atomic Operation
    await this.prisma.catalog.update({
      where: { id: command.catalogId },
      data: { maxSkuLimit: command.maxSkuLimit },
    });
  }
}

// Layer 3: Security & RBAC Guards on Controller
@Controller('catalogs')
@UseGuards(JwtAuthGuard, RequireActiveLicenseGuard, RolesGuard)
export class CatalogsController {
  @Post(':id/quota')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async updateQuota(@Param('id') catalogId: string, @Body() dto: UpdateCatalogQuotaDto) {
    return this.commandBus.execute(new UpdateCatalogQuotaCommand(catalogId, dto.maxSkuLimit));
  }
}
```

---

## 3. Concurrency Protection & Mutex Synchronization

To prevent race conditions during refresh token rotation or quota deductions:

```typescript
// Atomic Quota Increment/Decrement
await this.prisma.license.update({
  where: { id: licenseId },
  data: {
    consumedAiCredits: { increment: creditsUsed },
  },
});

// Mutex in-flight token refresh protection
private refreshPromise: Promise<AuthTokens> | null = null;

async refreshTokens(refreshToken: string): Promise<AuthTokens> {
  if (this.refreshPromise) {
    return this.refreshPromise;
  }

  this.refreshPromise = this.executeTokenRefresh(refreshToken)
    .finally(() => {
      this.refreshPromise = null;
    });

  return this.refreshPromise;
}
```

---

## 4. BullMQ Background Job Pattern

For heavy XML/CSV parsing and sync jobs:

```typescript
// Dispatching to queue (HTTP handler returns immediately with Job ID)
@Injectable()
export class FeedIngestionService {
  constructor(@InjectQueue('feed-ingestion') private readonly feedQueue: Queue) {}

  async queueFeedParse(feedId: string, s3Key: string): Promise<string> {
    const job = await this.feedQueue.add(
      'parse-xml',
      { feedId, s3Key },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
      },
    );
    return job.id!;
  }
}

// Worker Consumer
@Processor('feed-ingestion')
export class FeedIngestionProcessor extends WorkerHost {
  async process(job: Job<{ feedId: string; s3Key: string }>): Promise<void> {
    // Stream XML with sax/saxy to avoid memory exhaustion
  }
}
```

---

## 5. Centralized Exception Handling & Safe OS Execution

```typescript
// Safe OS binary execution (CWE-78 mitigation)
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function runSecureTool(binaryPath: string, args: string[]): Promise<string> {
  // Never pass unsanitized shell strings
  const { stdout } = await execFileAsync(binaryPath, args, {
    shell: false,
    timeout: 30000,
  });
  return stdout;
}
```
