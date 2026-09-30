'use client';

import React from 'react';
import { TargetApp, PlanType, Role, NavigationItemDto } from '@smartfeed/shared';
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
import { AVAILABLE_ICONS } from './constants';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export interface NavigationFormData {
  key: string;
  targetApp: TargetApp;
  labelUk: string;
  labelEn: string;
  path: string;
  icon: string;
  requiredRoles: Role[];
  requiredPlan: PlanType | null;
  isVisible: boolean;
}

interface NavigationItemDialogProps {
  isOpen: boolean;
  editingItem: NavigationItemDto | null;
  formData: NavigationFormData;
  setFormData: React.Dispatch<React.SetStateAction<NavigationFormData>>;
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function NavigationItemDialog({
  isOpen,
  editingItem,
  formData,
  setFormData,
  isSaving,
  onClose,
  onSave,
}: NavigationItemDialogProps) {
  const { t } = useLanguage();

  const toggleRole = (role: Role) => {
    setFormData((prev) => ({
      ...prev,
      requiredRoles: prev.requiredRoles.includes(role)
        ? prev.requiredRoles.filter((r) => r !== role)
        : [...prev.requiredRoles, role],
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? t('navigation', 'edit_item') : t('navigation', 'add_item')}
          </DialogTitle>
          <DialogDescription>
            {editingItem
              ? 'Змініть параметри існуючого пункту меню'
              : 'Введіть дані для нового пункту меню'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Key and TargetApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('navigation', 'key_label')}</Label>
              <Input
                disabled={!!editingItem}
                value={formData.key}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, key: e.target.value.toLowerCase() }))
                }
                placeholder={t('navigation', 'key_placeholder')}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{t('navigation', 'target_app_label')}</Label>
              <select
                value={formData.targetApp}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, targetApp: e.target.value as TargetApp }))
                }
                className="w-full h-9 rounded-md border border-border bg-card/60 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value={TargetApp.DESKTOP}>Desktop Client</option>
                <option value={TargetApp.ADMIN_PORTAL}>Admin Portal</option>
                <option value={TargetApp.ALL}>All Applications</option>
              </select>
            </div>
          </div>

          {/* Labels UK & EN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('navigation', 'label_uk_label')}</Label>
              <Input
                value={formData.labelUk}
                onChange={(e) => setFormData((prev) => ({ ...prev, labelUk: e.target.value }))}
                placeholder={t('navigation', 'label_uk_placeholder')}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{t('navigation', 'label_en_label')}</Label>
              <Input
                value={formData.labelEn}
                onChange={(e) => setFormData((prev) => ({ ...prev, labelEn: e.target.value }))}
                placeholder={t('navigation', 'label_en_placeholder')}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Path */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t('navigation', 'path_label')}</Label>
            <Input
              value={formData.path}
              onChange={(e) => setFormData((prev) => ({ ...prev, path: e.target.value }))}
              placeholder={t('navigation', 'path_placeholder')}
              className="h-9 text-xs font-mono"
            />
          </div>

          {/* Icon Selector */}
          <div className="space-y-2">
            <Label className="text-xs">{t('navigation', 'icon_label')}</Label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-2 rounded-xl border border-border/70 bg-muted/20 max-h-32 overflow-y-auto">
              {AVAILABLE_ICONS.map(({ name, icon: IconComponent }) => (
                <button
                  type="button"
                  key={name}
                  onClick={() => setFormData((prev) => ({ ...prev, icon: name }))}
                  className={cn(
                    'flex flex-col items-center justify-center p-2 rounded-lg border transition-all text-xs gap-1',
                    formData.icon === name
                      ? 'border-primary bg-primary/15 text-primary font-semibold shadow-sm'
                      : 'border-border/50 text-muted-foreground hover:bg-muted/60',
                  )}
                  title={name}
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="text-[10px] truncate max-w-full">{name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Required Roles and Min Plan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-2">
              <Label className="text-xs">{t('navigation', 'required_role_label')}</Label>
              <div className="space-y-1.5">
                {[Role.USER, Role.ADMIN, Role.SUPER_ADMIN].map((role) => (
                  <label
                    key={role}
                    className="flex items-center gap-2 text-xs text-foreground cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.requiredRoles.includes(role)}
                      onChange={() => toggleRole(role)}
                      className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                    />
                    <span>
                      {role === Role.SUPER_ADMIN
                        ? t('users', 'role_super_admin')
                        : role === Role.ADMIN
                          ? t('users', 'role_admin')
                          : t('users', 'role_user')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">{t('navigation', 'min_plan_label')}</Label>
              <select
                value={formData.requiredPlan || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    requiredPlan: e.target.value ? (e.target.value as PlanType) : null,
                  }))
                }
                className="w-full h-9 rounded-md border border-border bg-card/60 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">FREE (Усі користувачі)</option>
                <option value={PlanType.PRO}>PRO (Платний тариф)</option>
                <option value={PlanType.ENTERPRISE}>ENTERPRISE (Корпоративний)</option>
              </select>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isVisible}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, isVisible: e.target.checked }))
                    }
                    className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                  />
                  <span>{t('navigation', 'is_active_label')}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving} className="text-xs">
            {t('common', 'cancel')}
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving || !formData.labelUk || !formData.path}
            className="text-xs bg-primary"
          >
            {isSaving
              ? t('common', 'saving')
              : editingItem
                ? t('common', 'save')
                : t('common', 'create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
