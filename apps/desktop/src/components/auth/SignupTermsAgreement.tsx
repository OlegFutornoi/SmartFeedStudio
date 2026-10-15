interface SignupTermsAgreementProps {
  agreedToTerms: boolean;
  setAgreedToTerms: (agreed: boolean) => void;
  onOpenLegal?: (type: 'terms' | 'privacy') => void;
  t: (key: string) => string;
}

export function SignupTermsAgreement({
  agreedToTerms,
  setAgreedToTerms,
  onOpenLegal,
  t,
}: SignupTermsAgreementProps) {
  return (
    <label className="flex items-start gap-2 cursor-pointer text-xs text-muted-foreground select-none leading-tight">
      <input
        type="checkbox"
        checked={agreedToTerms}
        onChange={(e) => setAgreedToTerms(e.target.checked)}
        className="mt-0.5 h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
      />
      <span>
        {t('termsAgreement')}{' '}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onOpenLegal?.('terms');
          }}
          className="underline hover:text-foreground font-medium transition-colors"
        >
          {t('termsOfService')}
        </button>{' '}
        {t('and')}{' '}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onOpenLegal?.('privacy');
          }}
          className="underline hover:text-foreground font-medium transition-colors"
        >
          {t('privacyPolicy')}
        </button>
        .
      </span>
    </label>
  );
}
