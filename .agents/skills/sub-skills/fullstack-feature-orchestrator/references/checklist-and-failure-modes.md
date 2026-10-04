# 🛡️ Failure Modes & Edge Cases in Fullstack Features

Guidelines for anticipating, mitigating, and gracefully handling non-happy path conditions across fullstack features.

---

## 1. Network Failure & Offline Scenarios

| Failure Scenario                            | Frontend Behavior                                                              | Backend / Local Driver Behavior                          |
| :------------------------------------------ | :----------------------------------------------------------------------------- | :------------------------------------------------------- |
| **API Server unreachable (Cloud mode)**     | Display user-friendly banner with retry button. Keep cached data if available. | Log warning with context; reject with localized error.   |
| **Local SQLite locked / busy (Tauri mode)** | Display transient waiting state; do not crash UI.                              | Mutex queue with backoff retry (up to 3 attempts).       |
| **Request timeout (>15s)**                  | Abort via `AbortController`; notify user with timeout error message.           | Cancel BullMQ job if idempotent; release DB connections. |

---

## 2. Validation & Security Edge Cases

### CWE-78 Mitigation

Never concatenate dynamic variables into shell or system execution calls. Always use parameterized execution:

```typescript
// ❌ WRONG: Command injection vulnerability
exec(`open "${filePath}"`);

// ✅ RIGHT: Parameter array with shell: false
execFile(binaryPath, [filePath], { shell: false });
```

### Mutex Protection for Concurrency

When updating sensitive shared state (such as token refresh or quota recalculation):

```typescript
let refreshPromise: Promise<string> | null = null;

export async function getFreshToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = performTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}
```

---

## 3. Data Integrity & Cascade Failure Modes

1. **Partial Batch Import**:
   - If an XML feed containing 5,000 products fails on item 4,200 due to malformed XML, roll back the transaction or isolate invalid rows in a dead-letter queue.
   - Never leave partial, corrupt catalog states.
2. **Orphaned Media / S3 Keys**:
   - When deleting a product or catalog snapshot, emit an asynchronous deletion event to prune S3 objects.
   - Never leave disconnected blobs in storage.
3. **Foreign Key Deletion Constraint Violation**:
   - Always structure Prisma schemas with `onDelete: Cascade` or provide explicit cascade deletion in the service layer:
   ```prisma
   model Product {
     feedId String @map("feed_id")
     feed Feed @relation(fields: [feedId], references: [id], onDelete: Cascade)
     @@index([feedId])
   }
   ```

---

## 4. Zero Silent Failures Checklist

Every `catch` block MUST comply with one of these three patterns:

```typescript
// Pattern 1: Structured logging
try {
  await syncService.sync();
} catch (err) {
  console.warn('[FeedSync:Prune] Pruning failed:', err);
}

// Pattern 2: User notification
try {
  await api.save(payload);
} catch (err) {
  toast.error(getErrorMessage(err, t));
}

// Pattern 3: Domain exception transformation
try {
  await db.query();
} catch (err) {
  throw new DomainException('CATALOG_ACCESS_DENIED', { cause: err });
}
```
