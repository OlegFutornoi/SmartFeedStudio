import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { AuthHeroShowcase } from '@/components/auth/AuthHeroShowcase';
import { LegalDocumentModal, LegalDocType } from '@/components/auth/LegalDocumentModal';

interface AuthSplitLayoutProps {
  children:
    React.ReactNode | ((props: { onOpenLegal: (type: LegalDocType) => void }) => React.ReactNode);
  testId?: string;
}

export function AuthSplitLayout({ children, testId = 'auth-page' }: AuthSplitLayoutProps) {
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [legalType, setLegalType] = useState<LegalDocType>('terms');

  const handleOpenLegal = (type: LegalDocType) => {
    setLegalType(type);
    setIsLegalOpen(true);
  };

  return (
    <div
      data-testid={testId}
      className="relative flex h-screen max-h-screen w-full flex-col lg:grid lg:grid-cols-12 bg-background text-foreground overflow-hidden"
    >
      {/* Global Top-Right Controls */}
      <div className="absolute top-3 right-4 sm:top-5 sm:right-6 z-30 flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
      </div>

      {/* Left Column: Form & Brand Section */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-6 lg:p-8 xl:p-10 lg:col-span-6 xl:col-span-5 h-full overflow-y-auto lg:overflow-hidden">
        {/* Top Header: Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Layers className="h-4.5 w-4.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-bold tracking-tight text-foreground">
              SmartFeed Studio
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">
              Catalog & Feed Platform
            </span>
          </div>
        </div>

        {/* Center: Main Form Container */}
        <div className="my-auto flex w-full justify-center py-2 sm:py-4">
          <div className="w-full max-w-[420px]">
            {typeof children === 'function' ? children({ onOpenLegal: handleOpenLegal }) : children}
          </div>
        </div>

        {/* Bottom Footer with Interactive Legal Links */}
        <div className="flex flex-col items-center justify-between gap-1.5 border-t border-border/40 pt-2.5 text-center text-[11px] text-muted-foreground sm:flex-row sm:text-left">
          <span>© {new Date().getFullYear()} SmartFeed Studio. All rights reserved.</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenLegal('privacy')}
              className="hover:text-foreground transition-colors cursor-pointer underline-offset-2 hover:underline"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleOpenLegal('terms')}
              className="hover:text-foreground transition-colors cursor-pointer underline-offset-2 hover:underline"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Hero Visual Showcase (Desktop) */}
      <div className="relative hidden lg:col-span-6 xl:col-span-7 lg:flex flex-col border-l border-border/60 bg-muted/30 h-full overflow-hidden">
        <div className="h-full w-full">
          <AuthHeroShowcase />
        </div>
      </div>

      {/* Modal Dialog for Legal Documents */}
      <LegalDocumentModal
        isOpen={isLegalOpen}
        onClose={() => setIsLegalOpen(false)}
        initialType={legalType}
      />
    </div>
  );
}
