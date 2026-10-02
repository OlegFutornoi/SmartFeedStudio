import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  UserPlus,
  Lock,
  User,
  Mail,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation, getErrorMessage } from '@/i18n';
import { getInvitationDetails, acceptInvitation, type InvitationDetails } from '@/lib/api';

export const AcceptInvitePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const { setAuthSession } = useAuth();
  const { t } = useTranslation(['team', 'auth', 'common', 'errors']);

  const [details, setDetails] = useState<InvitationDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorRaw, setErrorRaw] = useState<unknown | null>(null);

  // Form state for new users
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!token) {
      setErrorRaw('invalidToken');
      setIsLoadingDetails(false);
      return;
    }

    setIsLoadingDetails(true);
    getInvitationDetails(token)
      .then((data) => {
        setDetails(data);
        setErrorRaw(null);
      })
      .catch((err) => {
        setErrorRaw(err);
      })
      .finally(() => {
        setIsLoadingDetails(false);
      });
  }, [token]);

  const handleAccept = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token) return;

    setErrorRaw(null);
    setIsSubmitting(true);

    try {
      const authResponse = await acceptInvitation({
        token,
        fullName: details?.isExistingUser ? undefined : fullName,
        password: details?.isExistingUser ? undefined : password,
      });

      setAuthSession(authResponse);
      navigate('/team', { replace: true });
    } catch (err) {
      setErrorRaw(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const errorMessage = errorRaw ? getErrorMessage(errorRaw, t) : null;

  if (isLoadingDetails) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">{t('team.loadingTeam')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Logo / Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
            <UserPlus className="h-4 w-4" />
            <span>SmartFeed Studio</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            {details?.organizationName || t('team.title')}
          </h1>
          <p className="text-xs text-muted-foreground">
            {details?.inviterName
              ? `${details.inviterName} запрошує вас приєднатися до команди`
              : t('team.subtitle')}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <Alert variant="destructive" data-testid="accept-invite-error-alert" className="py-2.5">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
          </Alert>
        )}

        {details && (
          <Card className="border-border/80 bg-card shadow-2xl backdrop-blur-md">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-bold">{details.organizationName}</CardTitle>
                </div>
                <Badge variant="secondary" className="text-[10px] font-semibold gap-1">
                  <Shield className="h-3 w-3 text-primary" />
                  <span>
                    {details.role === 'ADMIN' ? t('team.adminRole') : t('team.memberRole')}
                  </span>
                </Badge>
              </div>
              <CardDescription className="text-xs mt-1">
                Ваша робоча пошта: <strong className="text-foreground">{details.email}</strong>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              {details.isExistingUser ? (
                /* Existing User Screen */
                <div className="space-y-3 p-3.5 rounded-xl border border-border/70 bg-muted/20">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-foreground shrink-0" />
                    <span>Обліковий запис знайдено</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Ви вже маєте акаунт у системі. Натисніть кнопку нижче, щоб автоматично
                    приєднатися до простору компанії <strong>{details.organizationName}</strong>.
                  </p>
                </div>
              ) : (
                /* New User Screen */
                <form id="accept-invite-form" onSubmit={handleAccept} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="invite-fullname" className="text-xs font-semibold">
                      Ваше ім&apos;я та прізвище
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="invite-fullname"
                        required
                        placeholder="Олександр Петренко"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={isSubmitting}
                        className="pl-9 text-xs"
                        data-testid="invite-fullname-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="invite-email" className="text-xs font-semibold">
                      Робочий Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="invite-email"
                        disabled
                        value={details.email}
                        className="pl-9 text-xs bg-muted/40 font-mono opacity-80"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="invite-password" className="text-xs font-semibold">
                      Створіть надійний пароль (мін. 6 символів)
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="invite-password"
                        type="password"
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting}
                        className="pl-9 text-xs"
                        data-testid="invite-password-input"
                      />
                    </div>
                  </div>
                </form>
              )}
            </CardContent>

            <CardFooter className="pt-2 flex flex-col gap-2.5">
              <Button
                type={details.isExistingUser ? 'button' : 'submit'}
                form={details.isExistingUser ? undefined : 'accept-invite-form'}
                onClick={details.isExistingUser ? () => handleAccept() : undefined}
                disabled={isSubmitting}
                data-testid="submit-accept-invite-btn"
                className="w-full font-semibold gap-2"
                size="sm"
              >
                {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>
                  {details.isExistingUser
                    ? 'Приєднатися до компанії'
                    : 'Зареєструватися та приєднатися'}
                </span>
              </Button>

              <div className="text-center">
                <Link
                  to="/auth/login"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
                >
                  Увійти під іншим акаунтом
                </Link>
              </div>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
};
