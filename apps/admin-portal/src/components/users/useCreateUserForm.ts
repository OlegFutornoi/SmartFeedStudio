import { useState, useEffect, useCallback, useMemo } from 'react';
import { AccountType, PlanType, Role, UserListItemDto } from '@smartfeed/shared';
import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

export interface OwnerOption {
  organizationId: string;
  organizationName: string;
  ownerEmail: string;
  ownerFullName: string | null;
}

function generateSecurePassword(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
  return Array.from(crypto.getRandomValues(new Uint8Array(12)))
    .map((b) => chars[b % chars.length])
    .join('');
}

interface UseCreateUserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (user: UserListItemDto) => void;
}

export function useCreateUserForm({ open, onOpenChange, onCreated }: UseCreateUserFormProps) {
  const { t } = useLanguage();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>(Role.USER);
  const [accountType, setAccountType] = useState<AccountType>(AccountType.OWNER);
  const [companyName, setCompanyName] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [planCode, setPlanCode] = useState<PlanType>(PlanType.STARTER);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [ownersLoading, setOwnersLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setFullName('');
      setEmail('');
      setPassword('');
      setShowPassword(false);
      setRole(Role.USER);
      setAccountType(AccountType.OWNER);
      setCompanyName('');
      setSelectedOrgId('');
      setPlanCode(PlanType.STARTER);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (open && accountType === AccountType.MEMBER) {
      setOwnersLoading(true);
      api
        .getUsers({ orgRoleFilter: 'OWNERS', limit: 100 })
        .then((users) => {
          const opts: OwnerOption[] = users
            .filter((u) => u.organization?.isOwner)
            .map((u) => ({
              organizationId: u.organization!.organizationId,
              organizationName: u.organization!.organizationName,
              ownerEmail: u.email,
              ownerFullName: u.fullName,
            }));
          setOwners(opts);
        })
        .catch(() => setOwners([]))
        .finally(() => setOwnersLoading(false));
    }
  }, [open, accountType]);

  const handleGeneratePassword = useCallback(() => {
    const pwd = generateSecurePassword();
    setPassword(pwd);
    setShowPassword(true);
  }, []);

  const roleLabels = useMemo(
    () => ({
      user: t('users', 'role_user'),
      userDesc: t('users', 'role_user_desc'),
      admin: t('users', 'role_admin'),
      adminDesc: t('users', 'role_admin_desc'),
    }),
    [t],
  );

  const accountTypeLabels = useMemo(
    () => ({
      owner: t('users', 'account_owner'),
      ownerDesc: t('users', 'account_owner_desc'),
      member: t('users', 'account_member'),
      memberDesc: t('users', 'account_member_desc'),
    }),
    [t],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setIsLoading(true);

      try {
        const dto = {
          email,
          password,
          fullName,
          role,
          accountType: role === Role.USER ? accountType : AccountType.ADMIN,
          companyName: accountType === AccountType.OWNER ? companyName : undefined,
          organizationId: accountType === AccountType.MEMBER ? selectedOrgId : undefined,
          planCode: role === Role.USER && accountType === AccountType.OWNER ? planCode : undefined,
        };

        const created = await api.createUser(dto);
        onCreated(created);
        onOpenChange(false);
      } catch (err: unknown) {
        if (
          err instanceof Error &&
          (err.message.includes('already exists') || err.message.includes('409'))
        ) {
          setError(t('users', 'error_email_exists'));
        } else {
          setError(t('users', 'error_generic'));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      email,
      password,
      fullName,
      role,
      accountType,
      companyName,
      selectedOrgId,
      planCode,
      onCreated,
      onOpenChange,
      t,
    ],
  );

  return {
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
  };
}
