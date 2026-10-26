import { APIResponse, expect } from '@playwright/test';
import { z } from 'zod';
import { TestLogger } from '@/core/utils/test-logger';

export interface HttpResponseContext {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
}

/**
 * 4-Layer Defense Success Assertion
 * Layer 1: Crash Guard (not.toBe(500))
 * Layer 2: Deterministic Status (toBe(expectedStatus))
 * Layer 3: Protocol & Security Headers (JSON content-type + X-Content-Type-Options: nosniff)
 * Layer 4: Body Presence & Runtime Contract Schema Validation (Zod safeParse)
 */
export function assertSuccessResponse<T>(
  response: APIResponse,
  data: unknown,
  expectedStatus: number,
  schema?: z.ZodType<T>,
  context?: HttpResponseContext,
): T {
  const prefix = context ? `[${context.method} ${context.endpoint}] ` : '';

  // Layer 1: Crash Guard
  expect(response.status(), `${prefix}Server must not crash with 500`).not.toBe(500);

  // Layer 2: Deterministic Status Code
  expect(response.status(), `${prefix}Expected status ${expectedStatus}`).toBe(expectedStatus);

  // Layer 3: Protocol & Security Headers
  const contentType = response.headers()['content-type'] || '';
  expect(contentType, `${prefix}Content-Type header must match JSON`).toMatch(
    /application\/(?:problem\+)?json/,
  );
  expect(
    response.headers()['x-content-type-options'],
    `${prefix}Security header X-Content-Type-Options must be "nosniff"`,
  ).toBe('nosniff');

  // Layer 4: Body Truthiness & Contract Schema Validation
  expect(data, `${prefix}Response body must not be null/undefined`).toBeTruthy();

  if (schema) {
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      TestLogger.schema(
        context ? `${context.method} ${context.endpoint}` : 'ResponseSchema',
        false,
      );
      throw new Error(
        `${prefix}Response schema validation failed:\n` +
          JSON.stringify(parsed.error.format(), null, 2),
      );
    }
    TestLogger.schema(context ? `${context.method} ${context.endpoint}` : 'ResponseSchema', true);
    return parsed.data;
  }

  TestLogger.assertion('Шар 1-3', `${expectedStatus} OK | nosniff | JSON`);
  return data as T;
}

/**
 * 4-Layer Defense Error Assertion
 * Layer 1: Crash Guard (not.toBe(500))
 * Layer 2: Deterministic Error Status (toBe(expectedStatus))
 * Layer 3: Protocol Integrity (JSON content-type)
 * Layer 4: Standard RFC 7807 / NestJS Error Payload Structure
 */
export function assertErrorResponse(
  response: APIResponse,
  data: unknown,
  expectedStatus: number,
  context?: HttpResponseContext,
) {
  const prefix = context ? `[${context.method} ${context.endpoint}] ` : '';

  // Layer 1: Crash Guard
  expect(response.status(), `${prefix}Server must not crash with 500`).not.toBe(500);

  // Layer 2: Deterministic Status Code
  expect(response.status(), `${prefix}Expected error status ${expectedStatus}`).toBe(
    expectedStatus,
  );

  // Layer 3: Protocol & Security Headers Integrity
  const contentType = response.headers()['content-type'] || '';
  expect(contentType, `${prefix}Error response Content-Type must match JSON`).toMatch(
    /application\/(?:problem\+)?json/,
  );
  expect(
    response.headers()['x-content-type-options'],
    `${prefix}Security header X-Content-Type-Options must be "nosniff"`,
  ).toBe('nosniff');

  // Layer 4: Standard NestJS / RFC 7807 error schema validation
  expect(data, `${prefix}Error body must not be null/empty`).toBeTruthy();
  const errorObj = data as { statusCode?: number; message?: unknown; error?: string };
  expect(errorObj.statusCode, `${prefix}Error body must contain statusCode`).toBe(expectedStatus);
  expect(errorObj.message, `${prefix}Error body must contain error message`).toBeDefined();

  TestLogger.assertion('Шар 1-4', `${expectedStatus} ${errorObj.error || ''} | nosniff | RFC 7807`);
}
