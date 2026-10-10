import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Shield, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';
import {
  DEFAULT_TERMS_OF_SERVICE,
  DEFAULT_PRIVACY_POLICY,
  LegalDocumentData,
} from '@/components/auth/default-legal-content';

export type LegalDocType = 'terms' | 'privacy';

interface LegalDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: LegalDocType;
}

export function LegalDocumentModal({
  isOpen,
  onClose,
  initialType = 'terms',
}: LegalDocumentModalProps) {
  const [activeType, setActiveType] = useState<LegalDocType>(initialType);
  const { language } = useTranslation('auth');
  const lang = language === 'en' ? 'en' : 'uk';

  useEffect(() => {
    setActiveType(initialType);
  }, [initialType, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentDoc: LegalDocumentData =
    activeType === 'terms' ? DEFAULT_TERMS_OF_SERVICE[lang] : DEFAULT_PRIVACY_POLICY[lang];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      data-testid="legal-document-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-2xl max-h-[85vh] rounded-2xl border border-border bg-card text-card-foreground shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-6 py-4 bg-muted/20">
          <div className="flex items-center gap-2">
            {activeType === 'terms' ? (
              <FileText className="h-5 w-5 text-primary" />
            ) : (
              <Shield className="h-5 w-5 text-primary" />
            )}
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              {currentDoc.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            data-testid="close-legal-modal"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border/60 bg-muted/40 px-6">
          <button
            onClick={() => setActiveType('terms')}
            data-testid="tab-terms-of-service"
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-all ${
              activeType === 'terms'
                ? 'border-primary text-foreground font-semibold bg-background/50'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>{lang === 'uk' ? 'Умови використання' : 'Terms of Service'}</span>
          </button>
          <button
            onClick={() => setActiveType('privacy')}
            data-testid="tab-privacy-policy"
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-all ${
              activeType === 'privacy'
                ? 'border-primary text-foreground font-semibold bg-background/50'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>{lang === 'uk' ? 'Політика конфіденційності' : 'Privacy Policy'}</span>
          </button>
        </div>

        {/* Scrollable Document Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-sm leading-relaxed text-muted-foreground">
          <div className="flex items-center gap-2 text-xs text-muted-foreground/80 pb-2 border-b border-border/40">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {lang === 'uk' ? 'Останнє оновлення:' : 'Last updated:'} {currentDoc.lastUpdated}
            </span>
          </div>

          {currentDoc.sections.map((section, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
              {section.content.map((paragraph, pIdx) => (
                <p key={pIdx} className="text-xs sm:text-sm">
                  {paragraph}
                </p>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/80 px-6 py-3.5 bg-muted/20">
          <span className="text-[11px] text-muted-foreground">
            SmartFeed Studio Legal v2.0 • 100% Encrypted
          </span>
          <Button size="sm" onClick={onClose} data-testid="confirm-legal-modal-button">
            {lang === 'uk' ? 'Зрозуміло' : 'Close'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
