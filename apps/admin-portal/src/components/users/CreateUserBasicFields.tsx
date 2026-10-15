'use client';

import React from 'react';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { TranslationNamespace } from '@/i18n/types';

interface CreateUserBasicFieldsProps {
  fullName: string;
  setFullName: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  handleGeneratePassword: () => void;
  t: (namespace: TranslationNamespace, key: string) => string;
}

export function CreateUserBasicFields({
  fullName,
  setFullName,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  handleGeneratePassword,
  t,
}: CreateUserBasicFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground/80">
            {t('users', 'field_full_name')}
          </label>
          <Input
            data-testid="create-user-fullname-input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={t('users', 'field_full_name_placeholder')}
            required
            minLength={2}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground/80">
            {t('users', 'field_email')}
          </label>
          <Input
            data-testid="create-user-email-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('users', 'field_email_placeholder')}
            required
            className="h-8 text-xs"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground/80">
          {t('users', 'field_password')}
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              data-testid="create-user-password-input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('users', 'field_password_placeholder')}
              required
              minLength={6}
              className="h-8 text-xs pr-9 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGeneratePassword}
            className="h-8 px-2.5 text-xs gap-1.5 shrink-0"
            title={t('users', 'generate_password')}
          >
            <RefreshCw className="size-3" />
            {t('users', 'generate_password')}
          </Button>
        </div>
      </div>
    </>
  );
}
