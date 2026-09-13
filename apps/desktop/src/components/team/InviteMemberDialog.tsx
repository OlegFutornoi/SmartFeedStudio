import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { UserPlus, Mail, Shield, User, X, Loader2, AlertCircle, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation, getErrorMessage } from '@/i18n';

interface InviteMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: string) => Promise<{ inviteUrl?: string } | unknown>;
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
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setEmail('');
    setRole('MEMBER');
    setErrorRaw(null);
    setGeneratedLink(null);
    setIsCopied(false);
    onClose();
  };

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
      const res = await onInvite(trimmedEmail, role);
      if (
        res &&
        typeof res === 'object' &&
        'inviteUrl' in res &&
        typeof (res as { inviteUrl?: unknown }).inviteUrl === 'string'
      ) {
        setGeneratedLink((res as { inviteUrl: string }).inviteUrl);
      } else {
        handleClose();
      }
    } catch (err) {
      setErrorRaw(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (e) {
      console.warn('[InviteMemberDialog:handleCopyLink] Failed to copy invitation link:', e);
    }
  };

  const errorMessage = errorRaw ? getErrorMessage(errorRaw, t) : null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in-0 duration-200"
      data-testid="invite-member-dialog"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          data-testid="close-invite-dialog-btn"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label={t('team.cancel')}
        >
          <X className="h-4 w-4" />
        </button>

        {generatedLink ? (
          /* Success Screen: Copy Link */
          <div className="space-y-4 pt-1 animate-in fade-in-50 duration-200">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  {t('team.inviteLinkGenerated')}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">{t('team.inviteSuccess')}</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-xs font-medium text-muted-foreground">
                {t('team.inviteLinkDesc')}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={generatedLink}
                  data-testid="generated-invite-link-input"
                  className="text-xs bg-muted/40 font-mono select-all"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCopyLink}
                  data-testid="copy-invite-link-btn"
                  className="gap-1.5 shrink-0"
                  variant={isCopied ? 'default' : 'outline'}
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{t('team.copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>{t('team.copyInviteLink')}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-border">
              <Button
                type="button"
                size="sm"
                onClick={handleClose}
                data-testid="done-invite-btn"
                className="font-semibold"
              >
                {t('team.done')}
              </Button>
            </div>
          </div>
        ) : (
          /* Form Screen */
          <>
            <div className="flex items-center gap-3 pb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground">
                    {t('team.inviteModalTitle')}
                  </h2>
                  <Badge variant="secondary" className="text-[10px]">
                    {remainingSeats} з {maxSeats} вільних
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('team.inviteModalSubtitle')}
                </p>
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
                  onClick={handleClose}
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
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};
