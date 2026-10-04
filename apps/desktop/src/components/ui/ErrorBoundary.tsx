import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { captureException } from '@/lib/sentry';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Desktop ErrorBoundary] Uncaught exception:', error, errorInfo);
    captureException(error, { componentStack: errorInfo.componentStack });
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isUk =
        typeof localStorage !== 'undefined'
          ? localStorage.getItem('smartfeed_language') !== 'en'
          : true;

      return (
        <div
          data-testid="error-boundary-fallback"
          className="min-h-screen w-full flex items-center justify-center p-4 bg-background text-foreground animate-in fade-in duration-300"
        >
          <Card className="max-w-md w-full border-border/80 shadow-2xl bg-card">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mb-3 shadow-inner">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl font-bold tracking-tight">
                {isUk ? 'Щось пішло не так' : 'Something went wrong'}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1.5">
                {isUk
                  ? 'Сталася неочікувана помилка в інтерфейсі. Спробуйте перезавантажити сторінку.'
                  : 'An unexpected application error occurred. Try reloading the application.'}
              </CardDescription>
            </CardHeader>

            {this.state.error?.message && (
              <CardContent className="pt-0">
                <div className="p-3 bg-muted/50 rounded-lg border border-border/40 text-xs font-mono text-muted-foreground break-all max-h-24 overflow-y-auto">
                  {this.state.error.message}
                </div>
              </CardContent>
            )}

            <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                className="w-full sm:flex-1 gap-2"
                onClick={this.handleGoHome}
              >
                <Home className="h-4 w-4" />
                <span>{isUk ? 'На головну' : 'Go Home'}</span>
              </Button>
              <Button className="w-full sm:flex-1 gap-2 shadow-sm" onClick={this.handleReload}>
                <RefreshCw className="h-4 w-4" />
                <span>{isUk ? 'Перезавантажити' : 'Reload'}</span>
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
