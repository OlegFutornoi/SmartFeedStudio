'use client';

import React, { useEffect, useState } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Bug, ExternalLink, Activity } from 'lucide-react';

export default function SentryExamplePage() {
  const [hasSentError, setHasSentError] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Sentry.logger.info('Sentry example page loaded');
    async function checkConnectivity() {
      try {
        const result = await Sentry.diagnoseSdkConnectivity();
        setIsConnected(result !== 'sentry-unreachable');
      } catch (err) {
        console.warn('[SentryExamplePage] diagnoseSdkConnectivity check failed:', err);
        setIsConnected(true);
      }
    }
    checkConnectivity();
  }, []);

  const handleTriggerError = async () => {
    setLoading(true);
    try {
      Sentry.logger.info('User clicked test button, sending sample exception to Sentry');
      await Sentry.startSpan(
        {
          name: 'Manual Test Sentry Span',
          op: 'test.exception',
        },
        async () => {
          await fetch('/api/sentry-example-api').catch(() => null);
        },
      );
      Sentry.captureException(new Error('SmartFeed Studio Frontend Test Exception for Sentry'));
      setHasSentError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Sentry Monitoring Diagnostic
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Тестування та верифікація підключення Sentry SDK для відстеження помилок та
            продуктивності.
          </p>
        </div>
        <Badge variant={isConnected ? 'outline' : 'destructive'} className="gap-1.5 py-1 px-3">
          {isConnected ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              Sentry SDK Підключено
            </>
          ) : (
            <>
              <AlertCircle className="h-3.5 w-3.5" />
              Зʼєднання заблоковано
            </>
          )}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bug className="h-5 w-5 text-primary" />
            Перевірка відправки тестової помилки
          </CardTitle>
          <CardDescription>
            Натисніть кнопку нижче, щоб згенерувати тестовий виняток на фронтенді та бекенд Route
            Handler і перевірити надходження події в консоль Sentry.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={handleTriggerError}
              disabled={loading}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Bug className="h-4 w-4" />
              {loading ? 'Надсилання...' : 'Відправити тестову помилку'}
            </Button>

            <a
              href="https://smartfreestudio.sentry.io/issues/?project=4511967551946832"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Відкрити Sentry Dashboard
              </Button>
            </a>
          </div>

          {hasSentError && (
            <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg text-primary text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                Тестову подію успішно зафіксовано та надіслано в Sentry! Перевірте Issues у панелі
                Sentry.
              </span>
            </div>
          )}

          <div className="border border-border/50 rounded-lg p-4 bg-muted/20 space-y-2 text-xs text-muted-foreground font-mono">
            <div className="flex justify-between">
              <span>Organization:</span>
              <span className="text-foreground font-semibold">smartfreestudio</span>
            </div>
            <div className="flex justify-between">
              <span>Project:</span>
              <span className="text-foreground font-semibold">javascript-nextjs</span>
            </div>
            <div className="flex justify-between">
              <span>Project ID:</span>
              <span className="text-foreground font-semibold">4511967551946832</span>
            </div>
            <div className="flex justify-between">
              <span>Tunnel Route:</span>
              <span className="text-foreground font-semibold">/monitoring</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
