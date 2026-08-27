'use client';

import React from 'react';
import { UserPlus, Eye, EyeOff, RefreshCw, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { AccountType, Role, UserListItemDto } from '@smartfeed/shared';
import { RoleSelector } from './RoleSelector';
import { AccountTypeSelector } from './AccountTypeSelector';
import { PlanSelector } from './PlanSelector';
import { useCreateUserForm } from './useCreateUserForm';

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (user: UserListItemDto) => void;
}

export function CreateUserDialog({ open, onOpenChange, onCreated }: CreateUserDialogProps) {
  const {
    fullName,
    setFullName,
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    role,
    setRole,
    accountType,
    setAccountType,
    companyName,
    setCompanyName,
    selectedOrgId,
    setSelectedOrgId,
    planCode,
    setPlanCode,
    isLoading,
    error,
    owners,
    ownersLoading,
    handleGeneratePassword,
    roleLabels,
    accountTypeLabels,
    handleSubmit,
    t,
  } = useCreateUserForm({ open, onOpenChange, onCreated });

  const isUserRole = role === Role.USER;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="create-user-dialog"
        className="sm:max-w-[520px] p-0 overflow-hidden"
      >
        {/* Gradient header */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-border/60 px-6 pt-5 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-0.5">
              <div className="flex items-center justify-center size-8 rounded-lg bg-primary/15 text-primary">
                <UserPlus className="size-4" />
              </div>
              <DialogTitle
                data-testid="create-user-dialog-title"
                className="text-base font-semibold"
              >
                {t('users', 'create_user_dialog_title')}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground ml-[2.625rem]">
              {t('users', 'create_user_dialog_subtitle')}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Basic fields */}
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

          {/* Password */}
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

          {/* System Role Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground/80">
              {t('users', 'section_role')}
            </label>
            <RoleSelector selected={role} onChange={setRole} labels={roleLabels} />
          </div>

          {/* Account Type & Plan — only for USER role */}
          {isUserRole && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground/80">
                  {t('users', 'section_account_type')}
                </label>
                <AccountTypeSelector
                  selected={accountType}
                  onChange={setAccountType}
                  labels={accountTypeLabels}
                />
              </div>

              {/* Company Name & Tariff Plan for OWNER */}
              {accountType === AccountType.OWNER && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground/80">
                      {t('users', 'field_company_name')}
                    </label>
                    <Input
                      data-testid="create-user-company-input"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder={t('users', 'field_company_name_placeholder')}
                      className="h-8 text-xs"
                    />
                  </div>

                  {/* Tariff Plan — only for OWNER */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground/80">
                      {t('users', 'section_plan')}
                    </label>
                    <PlanSelector selected={planCode} onChange={setPlanCode} />
                  </div>
                </>
              )}

              {/* Organization selector for MEMBER */}
              {accountType === AccountType.MEMBER && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground/80">
                    {t('users', 'field_organization')}
                  </label>
                  {ownersLoading ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground h-8 px-2.5">
                      <Loader2 className="size-3.5 animate-spin" />
                      {t('users', 'field_organization_loading')}
                    </div>
                  ) : (
                    <select
                      data-testid="create-user-org-select"
                      value={selectedOrgId}
                      onChange={(e) => setSelectedOrgId(e.target.value)}
                      required
                      className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">{t('users', 'field_organization_placeholder')}</option>
                      {owners.map((o) => (
                        <option key={o.organizationId} value={o.organizationId}>
                          {o.organizationName} ({o.ownerFullName || o.ownerEmail})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </>
          )}

          {/* Error message */}
          {error && (
            <div
              data-testid="create-user-error"
              className="text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-md px-3 py-2"
            >
              {error}
            </div>
          )}
        </form>

        <DialogFooter className="px-6 py-3 border-t border-border/60 bg-muted/20 flex-row justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="create-user-cancel-btn"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="text-xs h-8 px-4"
          >
            {t('users', 'btn_cancel')}
          </Button>
          <Button
            type="submit"
            size="sm"
            data-testid="create-user-submit-btn"
            disabled={isLoading}
            onClick={handleSubmit}
            className="text-xs h-8 px-4 gap-1.5"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                {t('users', 'btn_creating')}
              </>
            ) : (
              <>
                <UserPlus className="size-3.5" />
                {t('users', 'btn_create')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
