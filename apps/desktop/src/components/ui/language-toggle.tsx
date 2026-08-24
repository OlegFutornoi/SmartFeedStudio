import { Globe } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { Button } from './button';

export function LanguageToggle() {
  const { language, setLanguage } = useTranslation('common');

  const toggleLanguage = () => {
    const nextLang = language === 'uk' ? 'en' : 'uk';
    setLanguage(nextLang);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      data-testid="language-toggle"
      className="h-9 px-2.5 gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold"
      aria-label="Toggle Language"
      title={`Current language: ${language.toUpperCase()}`}
    >
      <Globe className="h-3.5 w-3.5" />
      <span>{language === 'uk' ? 'UA' : 'EN'}</span>
    </Button>
  );
}
