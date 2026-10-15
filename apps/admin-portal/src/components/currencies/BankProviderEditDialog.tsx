'use client';

import React, { useState, useEffect } from 'react';
import { BankProviderConfigDto, UpdateBankProviderDto } from '@smartfeed/shared';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';

interface BankProviderEditDialogProps {
  provider: BankProviderConfigDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: BankProviderConfigDto) => void;
}

export function BankProviderEditDialog({
  provider,
  open,
  onOpenChange,
  onSaved,
}: BankProviderEditDialogProps) {
  const { locale } = useLanguage();
  const isUk = locale === 'uk';

  const [bankName, setBankName] = useState('');
  const [badge, setBadge] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [sellSpreadPercent, setSellSpreadPercent] = useState('0');
  const [buySpreadPercent, setBuySpreadPercent] = useState('0');
  const [isEnabled, setIsEnabled] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (provider) {
      setBankName(provider.bankName);
      setBadge(provider.badge);
      setLogoUrl(provider.logoUrl || '');
      setSellSpreadPercent(String(provider.sellSpreadPercent));
      setBuySpreadPercent(String(provider.buySpreadPercent));
      setIsEnabled(provider.isEnabled);
      setIsDefault(provider.isDefault);
      setError(null);
    }
  }, [provider]);

  if (!provider) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const sellSpread = parseFloat(sellSpreadPercent);
    const buySpread = parseFloat(buySpreadPercent);

    if (isNaN(sellSpread) || isNaN(buySpread)) {
      setError(
        isUk ? 'Введіть коректні числові значення маржі' : 'Please enter valid numeric spreads',
      );
      setIsSaving(false);
      return;
    }

    try {
      const payload: UpdateBankProviderDto = {
        bankName: bankName.trim(),
        badge: badge.trim(),
        logoUrl: logoUrl.trim() || null,
        sellSpreadPercent: sellSpread,
        buySpreadPercent: buySpread,
        isEnabled,
        isDefault,
      };

      const updated = await api.updateBankProvider(provider.id, payload);
      onSaved(updated);
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update provider';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            {isUk ? `Налаштування: ${provider.bankName}` : `Configure: ${provider.bankName}`}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isUk
              ? 'Налаштуйте відсоткові маржі купівлі/продажу відносно курсу НБУ та системний пріоритет'
              : 'Configure buy/sell spreads relative to NBU rate and default selection'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-2">
          {error && (
            <div className="rounded-md bg-destructive/10 p-2.5 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="bankName" className="text-xs">
              {isUk ? 'Назва банку' : 'Bank Name'}
            </Label>
            <Input
              id="bankName"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="h-8 text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="logoUrl" className="text-xs">
              {isUk ? 'URL логотипу / SVG іконки' : 'Logo URL / SVG Path'}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="logoUrl"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="/logos/banks/privat.svg"
                className="h-8 text-xs font-mono"
              />
              {logoUrl ? (
                <div className="size-8 rounded-md border border-border/60 bg-muted/30 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                  <img
                    src={logoUrl}
                    alt={bankName}
                    className="size-5 object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="badge" className="text-xs">
                {isUk ? 'Код / Бейдж' : 'Badge'}
              </Label>
              <Input
                id="badge"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="h-8 text-xs uppercase font-mono"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sourceType" className="text-xs">
                {isUk ? 'Тип джерела' : 'Source Type'}
              </Label>
              <Input
                id="sourceType"
                value={provider.sourceType}
                disabled
                className="h-8 text-xs font-mono bg-muted/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sellSpread" className="text-xs">
                {isUk ? 'Маржа продажу (%)' : 'Sell Spread (%)'}
              </Label>
              <Input
                id="sellSpread"
                type="number"
                step="0.05"
                value={sellSpreadPercent}
                onChange={(e) => setSellSpreadPercent(e.target.value)}
                className="h-8 text-xs font-mono"
                disabled={provider.bankId === 'nbu'}
              />
              <span className="text-2xs text-muted-foreground">
                {isUk ? '+% над курсом НБУ' : '+% over NBU rate'}
              </span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="buySpread" className="text-xs">
                {isUk ? 'Маржа купівлі (%)' : 'Buy Spread (%)'}
              </Label>
              <Input
                id="buySpread"
                type="number"
                step="0.05"
                value={buySpreadPercent}
                onChange={(e) => setBuySpreadPercent(e.target.value)}
                className="h-8 text-xs font-mono"
                disabled={provider.bankId === 'nbu'}
              />
              <span className="text-2xs text-muted-foreground">
                {isUk ? '-% під курсом НБУ' : '-% below NBU rate'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
            <div className="space-y-0.5">
              <span className="text-xs font-medium">
                {isUk ? 'Активний у системі' : 'Enabled in System'}
              </span>
              <p className="text-2xs text-muted-foreground">
                {isUk
                  ? 'Показувати цей банк у калькуляторах десктопу'
                  : 'Display this bank in desktop app'}
              </p>
            </div>
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
            <div className="space-y-0.5">
              <span className="text-xs font-medium">
                {isUk ? 'Основний банк за замовчуванням' : 'Default Bank'}
              </span>
              <p className="text-2xs text-muted-foreground">
                {isUk
                  ? 'Автоматично обирається при розрахунку цін'
                  : 'Selected automatically for price calculations'}
              </p>
            </div>
            <Switch checked={isDefault} onCheckedChange={setIsDefault} />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
              className="h-8 text-xs"
            >
              {isUk ? 'Скасувати' : 'Cancel'}
            </Button>
            <Button type="submit" size="sm" disabled={isSaving} className="h-8 text-xs">
              {isSaving
                ? isUk
                  ? 'Збереження...'
                  : 'Saving...'
                : isUk
                  ? 'Зберегти зміни'
                  : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
