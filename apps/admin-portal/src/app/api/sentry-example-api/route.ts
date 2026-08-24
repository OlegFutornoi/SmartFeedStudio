import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  Sentry.captureException(new Error('Sentry Example Backend Error (App Router API)'));
  return NextResponse.json(
    { success: true, message: 'Backend error captured by Sentry' },
    { status: 500 },
  );
}
