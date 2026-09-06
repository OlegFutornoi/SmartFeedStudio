# 🌐 REST API Design, Security & OpenAPI Standards (SmartFeed Studio)

Comprehensive standards for building secure, consistent, and well-documented REST APIs in `services/backend-api`.

---

## 1. 🛣 RESTful Endpoint & Routing Conventions

1. **Plural Nouns for Resources**:
   - ✅ `/api/catalogs`, `/api/licenses`, `/api/users`, `/api/tariff-plans`
   - ❌ `/api/getCatalog`, `/api/user-list`, `/api/doPayment`
2. **Kebab-case URLs**:
   - All path segments must be lowercase kebab-case (e.g. `/api/team-invitations`, `/api/tariff-plans`).
3. **Single Canonical Endpoint per Business Process**:
   - Every operation has exactly one authoritative endpoint.
   - Example: Password changes live strictly in `AuthController` (`/auth/change-password`), never duplicated across `UsersController`.
4. **Hierarchical Sub-resources**:
   - Parent-child scoping: `/api/organizations/:orgId/members`, `/api/catalogs/:catalogId/snapshots`.

---

## 2. 🚦 HTTP Verbs & Status Code Matrix

| Verb         | Semantics                |        Success Code         | Idempotent | Usage Guidelines                                                      |
| :----------- | :----------------------- | :-------------------------: | :--------: | :-------------------------------------------------------------------- |
| **`GET`**    | Read resource            |          `200 OK`           |    Yes     | Never mutates data. Safe to cache or retry.                           |
| **`POST`**   | Create or trigger action |  `201 Created` / `200 OK`   |     No     | `201` when creating resource; `200` for actions (e.g. `/auth/login`). |
| **`PUT`**    | Full replacement         |          `200 OK`           |    Yes     | Replaces entire entity representation.                                |
| **`PATCH`**  | Partial update           |          `200 OK`           |   No/Yes   | Updates only supplied fields.                                         |
| **`DELETE`** | Remove resource          | `200 OK` / `204 No Content` |    Yes     | Repeated calls must succeed or return 404 without error.              |

### Standard Error Status Codes:

- **`400 Bad Request`**: DTO validation failure via `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`.
- **`401 Unauthorized`**: Missing, expired, or invalid JWT token.
- **`403 Forbidden`**: Valid token, but insufficient permissions (`RolesGuard`) or expired/missing plan (`RequireActiveLicenseGuard`).
- **`404 Not Found`**: Resource ID does not exist in the database.
- **`409 Conflict`**: Unique constraint violation (e.g. email or license key already registered).
- **`422 Unprocessable Entity`**: Request format is valid, but violates business invariants (e.g. insufficient balance).
- **`429 Too Many Requests`**: Rate limit exceeded (`ThrottlerGuard`).
- **`500 Internal Server Error`**: Unhandled server exception (caught by `GlobalHttpExceptionFilter`, logged, sanitized for client).

---

## 3. 📖 OpenAPI / Swagger Documentation Rules

Every controller and DTO must be fully annotated for `/api/docs`:

```typescript
@ApiTags('Catalogs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('catalogs')
export class CatalogsController {
  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new product feed catalog' })
  @ApiResponse({
    status: 201,
    description: 'Catalog successfully created',
    type: CatalogResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Active license required or insufficient role' })
  async createCatalog(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCatalogDto,
  ): Promise<CatalogResponseDto> {
    return this.commandBus.execute(new CreateCatalogCommand(user.organizationId, dto));
  }
}
```

### DTO Property Annotations:

```typescript
export class CreateCatalogDto {
  @ApiProperty({ example: 'Main Electronics Feed', description: 'Catalog display name' })
  @IsString()
  @IsNotEmpty()
  readonly name!: string;

  @ApiPropertyOptional({
    example: 'https://example.com/feed.xml',
    description: 'Remote XML/CSV source URL',
  })
  @IsUrl()
  @IsOptional()
  readonly sourceUrl?: string;

  @ApiProperty({ enum: FeedFormat, example: FeedFormat.XML })
  @IsEnum(FeedFormat)
  readonly format!: FeedFormat;
}
```

---

## 4. 🛡 API Security & Data Sanitization

1. **Zero Secret Leaks (Response Serialization)**:
   - **NEVER** return raw Prisma entities containing `passwordHash`, `salt`, `refreshTokenHash`, or internal API keys.
   - Use explicit mapper functions (e.g. `mapUserToResponseDto(user)`) or `@Exclude()` with `ClassSerializerInterceptor`.
2. **Rate Limiting (`@nestjs/throttler`)**:
   - Protect all authentication, password-recovery, and registration endpoints with `@UseGuards(ThrottlerGuard)`.
   - Prevent brute-force password guessing and credential stuffing attacks.
3. **Whitelisted Payloads**:
   - `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`
   - Silently stripping unexpected parameters or throwing a 400 error prevents mass-assignment vulnerabilities.
4. **Input Sanitization**:
   - Strip leading/trailing whitespaces (`@Transform(({ value }) => typeof value === 'string' ? value.trim() : value)`).
   - Normalize emails to lowercase before validation and querying.
5. **Tenant Scoping on Every Mutation**:
   - Ensure `organizationId` or `userId` is extracted from the validated JWT (`@CurrentUser()`), NEVER trusted from URL params or request bodies without verifying user ownership.
