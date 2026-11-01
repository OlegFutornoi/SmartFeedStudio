/**
 * SmartFeed Studio — database & Prisma structural invariants.
 *
 *  DB-01 100% Foreign Key Indexes
 *  DB-02 Mandatory @db.Timestamptz(6)
 *  DB-03 100% snake_case Database Identifiers (@@map)
 *  DB-04 CUID Primary Key Ordering
 *  DB-05 Cascade Deletions (onDelete: Cascade)
 *  DB-06 Zero N+1 Queries
 *  DB-07 Cursor Pagination on High-Volume Feeds and Storage
 *  DB-08 Short $transaction Blocks
 *  DB-09 Connection Pooling via @prisma/adapter-pg
 *  DB-10 GIN pg_trgm Extension
 *  BE-04 Zero Hardcoded Fallback Secrets in DATABASE_URL
 */

export function checkPrismaSchema(relPath, content, out) {
  if (!relPath.endsWith('.prisma')) return;

  const models = content.split(/^model\s+/m).slice(1);
  for (const m of models) {
    const modelName = m.split(/[\s{]/)[0];
    const lines = m.split('\n');

    // DB-04: CUID Primary Key Ordering
    const idLine = lines.find((l) => /^\s*id\s+/.test(l));
    if (idLine && (!idLine.includes('@id') || !idLine.includes('@default(cuid())'))) {
      out.push({
        rule: 'DB-04',
        line: 1,
        message: `Model ${modelName} primary key must use @default(cuid()).`,
      });
    }

    // DB-02: Mandatory @db.Timestamptz(6)
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (/^\s*\w+\s+DateTime/.test(l) && !l.includes('@db.Timestamptz(6)')) {
        out.push({
          rule: 'DB-02',
          line: i + 1,
          message: `Model ${modelName} DateTime field missing mandatory @db.Timestamptz(6).`,
        });
      }
    }

    // DB-03: 100% snake_case Database Identifiers (@@map)
    if (!m.includes('@@map(')) {
      out.push({
        rule: 'DB-03',
        line: 1,
        message: `Model ${modelName} missing @@map("snake_case").`,
      });
    }

    // DB-01: 100% Foreign Key Indexes
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const relMatch = l.match(/@relation\([^)]*fields:\s*\[([^\]]+)\]/);
      if (relMatch) {
        const fkFields = relMatch[1].split(',').map((s) => s.trim());
        for (const fk of fkFields) {
          const hasIndex = lines.some((line) => {
            return (
              (line.includes('@@index([') && line.includes(fk)) ||
              (line.includes('@@unique([') && line.includes(fk)) ||
              new RegExp(`^\\s*${fk}\\s+[^@]+@unique`).test(line)
            );
          });
          if (!hasIndex) {
            out.push({
              rule: 'DB-01',
              line: i + 1,
              message: `Model ${modelName} foreign key '${fk}' missing @@index([${fk}]).`,
            });
          }
        }
      }
    }

    // DB-05: Cascade Deletions (onDelete: Cascade)
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (l.includes('@relation(') && l.includes('fields:') && !l.includes('onDelete:')) {
        out.push({
          rule: 'DB-05',
          line: i + 1,
          message: `Model ${modelName} relation missing explicit onDelete: action.`,
        });
      }
    }
  }

  // DB-10: GIN pg_trgm extension
  if (!content.includes('extensions = [pg_trgm]')) {
    out.push({
      rule: 'DB-10',
      line: 1,
      message: 'schema.prisma datasource db missing mandatory extensions = [pg_trgm].',
    });
  }
}

export function checkPrismaService(relPath, content, out) {
  if (!relPath.endsWith('prisma.service.ts')) return;

  // DB-09: Connection Pooling via @prisma/adapter-pg
  if (!content.includes('@prisma/adapter-pg') || !content.includes('PrismaPg')) {
    out.push({
      rule: 'DB-09',
      line: 1,
      message: 'PrismaService must use @prisma/adapter-pg connection pooling driver.',
    });
  }

  // BE-04: Zero Hardcoded Fallback Secrets in DATABASE_URL
  if (/DATABASE_URL\s*(?:\|\||\?\?)\s*['"][^'"]+['"]/.test(content)) {
    out.push({
      rule: 'BE-04',
      line: 1,
      message: 'DATABASE_URL fallback string prohibited (CWE-798). Missing env must throw immediately.',
    });
  }
}

export function checkCursorPagination(relPath, content, out) {
  if (
    (relPath.includes('feeds') || relPath.includes('storage') || relPath.includes('products')) &&
    relPath.endsWith('.service.ts')
  ) {
    if (content.includes('.findMany(') && content.includes('skip:') && !content.includes('cursor:')) {
      out.push({
        rule: 'DB-07',
        line: 1,
        message: 'High-volume feed/storage queries must support cursor-based pagination over OFFSET.',
      });
    }
  }
}

export function checkZeroNPlusOne(content, out) {
  const lines = content.split('\n');
  let inLoop = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/\b(?:for\s*\(|\.map\(|\.forEach\()/.test(l)) {
      inLoop = true;
    }
    if (inLoop && /prisma\.\w+\.(?:findUnique|findFirst)\(/.test(l)) {
      out.push({
        rule: 'DB-06',
        line: i + 1,
        message: 'Potential N+1 query loop: prisma findUnique/findFirst called inside loop.',
      });
    }
    if (l.includes('}') && inLoop) {
      inLoop = false;
    }
  }
}

export function checkShortTransactions(content, out) {
  if (!content.includes('$transaction')) return;
  const txBlocks = content.split('$transaction');
  for (let i = 1; i < txBlocks.length; i++) {
    const block = txBlocks[i].slice(0, 800);
    if (/\b(?:fetch\s*\(|axios\b|\.add\s*\(|httpService\b)/.test(block)) {
      out.push({
        rule: 'DB-08',
        line: 1,
        message: 'Non-database operation (HTTP/Queue/External API) inside $transaction block.',
      });
    }
  }
}

