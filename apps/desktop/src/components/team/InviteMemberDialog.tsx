import React, { useState } from 'react';
import { UserPlus, Mail, Shield, User, X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation, getErrorMessage } from '@/i18n';

interface InviteMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: string) => Promise<void>;
  remainingSeats: number;
  maxSeats: number;
}

export const InviteMemberDialog: React.FC<InviteMemberDialogProps> = ({
  isOpen,
  onClose,
  onInvite,
  remainingSeats,
  maxSeats,
}) => {
  const { t } = useTranslation(['team', 'common', 'errors']);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [isLoading, setIsLoading] = useState(false);
  const [errorRaw, setErrorRaw] = useState<unknown | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorRaw(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorRaw('emailRequired');
      return;
    }

    setIsLoading(true);
    try {
      await onInvite(trimmedEmail, role);
      setEmail('');
      setRole('MEMBER');
      onClose();
    } catch (err) {
      setErrorRaw(err);
    } finally {
      setIsLoading(false);
    }
  };

  const errorMessage = errorRaw ? getErrorMessage(errorRaw, t) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0"
      data-testid="invite-member-dialog"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          data-testid="close-invite-dialog-btn"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label={t('team.cancel')}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 pb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">{t('team.inviteModalTitle')}</h2>
              <Badge variant="secondary" className="text-[10px]">
                {remainingSeats} з {maxSeats} вільних
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{t('team.inviteModalSubtitle')}</p>
          </div>
        </div>

        {errorMessage && (
          <Alert variant="destructive" data-testid="invite-error-alert" className="py-2.5 mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="colleague-email" className="text-xs font-semibold">
              {t('team.emailLabel')}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="colleague-email"
                type="email"
                required
                placeholder={t('team.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                data-testid="invite-email-input"
                className="pl-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">{t('team.roleLabel')}</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('MEMBER')}
                data-testid="role-member-btn"
                className={`flex flex-col gap-1 p-3 rounded-xl border text-left transition-all ${
                  role === 'MEMBER'
                    ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                    : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span>{t('team.memberRole')}</span>
                </div>
                <span className="text-[10px] leading-tight text-muted-foreground">
                  {t('team.memberRoleDesc')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRole('ADMIN')}
                data-testid="role-admin-btn"
                className={`flex flex-col gap-1 p-3 rounded-xl border text-left transition-all ${
                  role === 'ADMIN'
                    ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary'
                    : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  <span>{t('team.adminRole')}</span>
                </div>
                <span className="text-[10px] leading-tight text-muted-foreground">
                  {t('team.adminRoleDesc')}
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
              data-testid="cancel-invite-btn"
            >
              {t('team.cancel')}
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading}
              data-testid="submit-invite-btn"
              className="gap-2 font-semibold"
            >
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{isLoading ? t('team.sendingInvite') : t('team.sendInvite')}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
