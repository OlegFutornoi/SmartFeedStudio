/**
 * SmartFeed Studio — Security & Backend CQRS Guardrails.
 *
 *  BE-06  Commercial Plan Upgrade Gating
 *  BE-09  Large Feed SAX Streaming Backpressure
 *  BE-10  BullMQ Queue Resilience
 *  BE-12  Anti-BOLA Tenant & Organization Isolation
 *  BE-13  Atomic Payment Webhook Processing
 *  SEC-04 BOLA / IDOR Tenant Isolation
 *  SEC-08 Zero 0-SKU Feed Progression
 *  SEC-09 Strict Public DTO Whitelisting (Mass Assignment Defense)
 */

export function checkSecurityRules(relPath, content, out) {
  // BE-12 & SEC-04: Anti-BOLA in suppliers/feeds handlers
  if (
    relPath.startsWith('services/backend-api/src/modules/suppliers/') &&
    relPath.endsWith('.handler.ts')
  ) {
    if (
      content.includes('.supplier.findFirst(') ||
      content.includes('.supplier.findMany(')
    ) {
      if (
        /where:\s*\{[^}]*\buserId\b[^}]*\}/.test(content) &&
        !content.includes('organizationId') &&
        !content.includes('tenancyWhere')
      ) {
        out.push({
          rule: 'BE-12',
          line: 1,
          message:
            'Anti-BOLA violation: Query filters supplier strictly by userId. Use getSupplierTenancyWhere.',
        });
        out.push({
          rule: 'SEC-04',
          line: 1,
          message:
            'BOLA/IDOR risk: Missing organizationId scoping in tenant resource query.',
        });
      }
    }
  }

  // BE-06: Commercial Plan Upgrade Gating
  if (relPath.endsWith('select-tariff-plan.handler.ts')) {
    if (
      !content.includes('paymentTransactionId') ||
      !content.includes('PAYMENT_REQUIRED')
    ) {
      out.push({
        rule: 'BE-06',
        line: 1,
        message:
          'Commercial plan selection must gate paid plans with paymentTransactionId validation.',
      });
    }
  }

  // BE-09: Large Feed SAX Streaming Backpressure
  if (
    relPath.startsWith('services/backend-api/src/modules/feeds/') &&
    relPath.endsWith('.ts')
  ) {
    if (
      /\bfs\.readFileSync\(/.test(content) &&
      !relPath.endsWith('.spec.ts') &&
      !relPath.endsWith('.test.ts')
    ) {
      out.push({
        rule: 'BE-09',
        line: 1,
        message:
          'Feed ingestion must stream via SAX/pipeline; synchronous fs.readFileSync is prohibited.',
      });
    }
  }

  // BE-10: BullMQ Queue Resilience
  if (
    relPath.startsWith('services/backend-api/src/modules/') &&
    relPath.endsWith('.ts')
  ) {
    if (content.includes('.addBulk(') && !content.includes('jobId:')) {
      out.push({
        rule: 'BE-10',
        line: 1,
        message:
          'BullMQ addBulk jobs must declare deterministic jobId for worker idempotency.',
      });
    }
  }

  // BE-13: Atomic Payment Webhook Processing
  if (relPath.endsWith('handle-wayforpay-webhook.handler.ts')) {
    if (
      !content.includes('SelectTariffPlanCommand') &&
      !content.includes('$transaction')
    ) {
      out.push({
        rule: 'BE-13',
        line: 1,
        message:
          'Payment webhook approval must atomically provision license before setting APPROVED.',
      });
    }
  }

  // SEC-09: Strict Public DTO Whitelisting
  if (
    relPath.startsWith('packages/shared/src/contracts/auth/') &&
    relPath.includes('register')
  ) {
    if (/\b(?:role\??:\s*Role|isAdmin|isSuperAdmin)\b/.test(content)) {
      out.push({
        rule: 'SEC-09',
        line: 1,
        message:
          'Mass Assignment vulnerability: Public registration DTO must not expose privilege fields.',
      });
    }
  }

  // SEC-08: Zero 0-SKU Feed Progression
  if (
    relPath.includes('feed') &&
    (relPath.endsWith('.service.ts') || relPath.endsWith('.handler.ts'))
  ) {
    if (content.includes('totalDetected') && !content.includes('totalDetected > 0') && !content.includes('totalDetected === 0')) {
      out.push({
        rule: 'SEC-08',
        line: 1,
        message:
          'Zero 0-SKU Feed Progression: Must guard against feeds with zero detected products.',
      });
    }
  }
}

