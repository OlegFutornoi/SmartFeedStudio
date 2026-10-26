/**
 * @fileoverview High-signal, compact structured logger for Playwright tests
 *
 * Professional ASCII formatting with ZERO emojis.
 * Complies with repository strict no-emoji policy and pw-api Section 8 invariants.
 */

const IS_COLOR_SUPPORTED =
  !process.env.NO_COLOR &&
  (process.env.FORCE_COLOR !== '0' || (process.stdout && process.stdout.isTTY));

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
};

function colorize(color: keyof typeof ANSI, text: string): string {
  if (!IS_COLOR_SUPPORTED) return text;
  return `${ANSI[color]}${text}${ANSI.reset}`;
}

export class TestLogger {
  private static isQuiet = process.env.E2E_LOGS === 'quiet';

  /**
   * Masks secrets such as Bearer tokens, passwords, and sensitive keys
   */
  static maskSecret(value: unknown): string {
    if (typeof value !== 'string') return String(value);
    if (value.startsWith('Bearer ')) {
      return `Bearer ${value.slice(7, 15)}...***`;
    }
    if (value.length > 20 && value.includes('.')) {
      // Possible JWT
      return `${value.slice(0, 8)}...***`;
    }
    return value;
  }

  /**
   * Logs test suite or test case title
   */
  static test(id: string, name: string): void {
    if (this.isQuiet) return;
    const badge = colorize('cyan', colorize('bold', `[TEST ${id}]`));
    console.log(`\n  ${badge} ${colorize('bold', name)}`);
  }

  /**
   * Logs a logical test step
   */
  static step(current: number, total: number, description: string): void {
    if (this.isQuiet) return;
    const stepBadge = colorize('magenta', `[STEP ${current}/${total}]`);
    console.log(`    ${stepBadge} ${description}`);
  }

  /**
   * Logs an outgoing HTTP request (concise 1-line)
   */
  static request(method: string, endpoint: string, summary?: string): void {
    if (this.isQuiet) return;
    const m = colorize('bold', method.toUpperCase());
    const ep = colorize('cyan', endpoint);
    const details = summary ? colorize('gray', ` (${summary})`) : '';
    console.log(`    ${colorize('bold', '[REQ]')} ${m} ${ep}${details}`);
  }

  /**
   * Logs an incoming HTTP response with execution timing and status code
   */
  static response(status: number, durationMs: number, summary?: string): void {
    if (this.isQuiet) return;
    const time = colorize('gray', `(${durationMs}ms)`);
    const extra = summary ? colorize('gray', ` | ${summary}`) : '';

    if (status >= 200 && status < 300) {
      const code = colorize('green', colorize('bold', `${status}`));
      console.log(`    ${colorize('green', '[RES]')} ${code} OK ${time}${extra}`);
    } else if (status >= 400 && status < 500) {
      const code = colorize('yellow', colorize('bold', `${status}`));
      console.log(`    ${colorize('yellow', '[RES]')} ${code} Client Handled ${time}${extra}`);
    } else {
      const code = colorize('red', colorize('bold', `${status}`));
      console.log(`    ${colorize('red', '[RES]')} ${code} Server Error ${time}${extra}`);
    }
  }

  /**
   * Logs expected vs actual status verification
   */
  static status(actual: number, expected: number): void {
    if (this.isQuiet) return;
    const isMatch = actual === expected;
    const color = isMatch ? 'green' : 'red';
    console.log(`    ${colorize(color, `[STATUS]`)} Actual: ${actual} | Expected: ${expected}`);
  }

  /**
   * Logs runtime contract schema validation status (Zod / JSON Schema)
   */
  static schema(schemaName: string, isValid: boolean, errorDetails?: string): void {
    if (this.isQuiet) return;
    if (isValid) {
      console.log(`    ${colorize('green', '[SCHEMA]')} OK - ${schemaName} valid`);
    } else {
      console.log(
        `    ${colorize('red', '[SCHEMA]')} FAIL - ${schemaName} contract mismatch:\n${errorDetails || ''}`,
      );
    }
  }

  /**
   * Logs 4-layer defense assertion results
   */
  static assertion(layer: string, description: string): void {
    if (this.isQuiet) return;
    console.log(`    ${colorize('cyan', `[ASSERT]`)} ${layer} - ${description}`);
  }

  /**
   * Logs entity state transition (for lifecycle testing)
   */
  static state(entityId: string, state: string): void {
    if (this.isQuiet) return;
    console.log(`    ${colorize('magenta', '[STATE]')} ${entityId} -> ${state}`);
  }

  /**
   * Logs success verification message
   */
  static success(message: string): void {
    if (this.isQuiet) return;
    console.log(`    ${colorize('green', '[PASS]')} ${message}`);
  }

  /**
   * Logs warning message
   */
  static warn(message: string): void {
    console.log(`    ${colorize('yellow', '[WARN]')} ${message}`);
  }

  /**
   * Logs failure with concise details
   */
  static failure(message: string, error?: unknown): void {
    const errorMsg =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null
          ? JSON.stringify(error)
          : String(error || '');
    console.log(
      `    ${colorize('red', colorize('bold', '[FAIL]'))} ${message}${errorMsg ? colorize('gray', ` - ${errorMsg}`) : ''}`,
    );
  }
}

/**
 * Backward-compatible alias for pw-api Section 8 invariants
 */
export const ApiLogger = TestLogger;
