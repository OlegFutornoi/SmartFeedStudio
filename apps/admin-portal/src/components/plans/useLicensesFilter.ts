import { useMemo } from 'react';
import { AdminLicenseItemDto } from '@smartfeed/shared';
import { FacetedOption } from '@/components/plans/LicensesFacetedFilter';

export interface LicensesFilterState {
  searchQuery: string;
  selectedTier: string;
  selectedStatus: string;
  selectedCloud: string;
  sortBy: string;
}

interface UseLicensesFilterResult {
  filteredLicenses: AdminLicenseItemDto[];
  isFiltered: boolean;
  tierOptions: FacetedOption[];
  statusOptions: FacetedOption[];
  cloudOptions: FacetedOption[];
  sortOptions: { value: string; label: string }[];
}

export function useLicensesFilter(
  licenses: AdminLicenseItemDto[],
  filter: LicensesFilterState,
  isUk: boolean,
): UseLicensesFilterResult {
  const tierOptions: FacetedOption[] = useMemo(() => {
    const counts: Record<string, number> = {};
    licenses.forEach((lic) => {
      const tier = lic.planType || 'OTHER';
      counts[tier] = (counts[tier] || 0) + 1;
    });
    const knownTiers = ['STARTER', 'GROWTH', 'PRO', 'ENTERPRISE'];
    const allFoundTiers = Array.from(new Set([...knownTiers, ...Object.keys(counts)]));
    return [
      { value: 'ALL', label: isUk ? 'Всі тарифи' : 'All Plans', count: licenses.length },
      ...allFoundTiers
        .filter((t) => counts[t] !== undefined)
        .map((tier) => ({ value: tier, label: tier, count: counts[tier] || 0 })),
    ];
  }, [licenses, isUk]);

  const statusOptions: FacetedOption[] = useMemo(() => {
    const now = new Date();
    let activeCount = 0;
    let suspendedCount = 0;
    let expiredCount = 0;
    let lifetimeCount = 0;

    licenses.forEach((lic) => {
      const isExpired = Boolean(lic.expiresAt) && new Date(lic.expiresAt!) <= now;
      if (!lic.isActive) suspendedCount += 1;
      else if (isExpired) expiredCount += 1;
      else activeCount += 1;
      if (lic.isActive && lic.expiresAt === null) lifetimeCount += 1;
    });

    return [
      { value: 'ALL', label: isUk ? 'Всі статуси' : 'All Statuses', count: licenses.length },
      { value: 'ACTIVE', label: isUk ? 'Активні' : 'Active', count: activeCount },
      { value: 'SUSPENDED', label: isUk ? 'Призупинені' : 'Suspended', count: suspendedCount },
      { value: 'EXPIRED', label: isUk ? 'Закінчилися' : 'Expired', count: expiredCount },
      { value: 'LIFETIME', label: isUk ? 'Безстрокові' : 'Lifetime', count: lifetimeCount },
    ];
  }, [licenses, isUk]);

  const cloudOptions: FacetedOption[] = useMemo(() => {
    const withCloud = licenses.filter((l) => l.canCloudBackup).length;
    const noCloud = licenses.length - withCloud;
    return [
      { value: 'ALL', label: isUk ? 'Всі' : 'All', count: licenses.length },
      { value: 'WITH_CLOUD', label: isUk ? 'З S3 бекапом' : 'With S3 Backup', count: withCloud },
      { value: 'NO_CLOUD', label: isUk ? 'Без бекапу' : 'No Backup', count: noCloud },
    ];
  }, [licenses, isUk]);

  const sortOptions = useMemo(
    () => [
      { value: 'NEWEST', label: isUk ? 'Найновіші' : 'Newest' },
      { value: 'EXPIRY_ASC', label: isUk ? 'Термін дії (найближчі)' : 'Expiry (Earliest)' },
      { value: 'XML_DESC', label: isUk ? 'Ліміт XML (спадання)' : 'XML Limit (High-Low)' },
      { value: 'AI_DESC', label: isUk ? 'AI Кредити (спадання)' : 'AI Credits (High-Low)' },
    ],
    [isUk],
  );

  const filteredLicenses: AdminLicenseItemDto[] = useMemo(() => {
    const { searchQuery, selectedTier, selectedStatus, selectedCloud, sortBy } = filter;
    const now = new Date();
    const query = searchQuery.toLowerCase().trim();

    return licenses
      .filter((lic) => {
        if (query) {
          const matchKey = lic.licenseKey?.toLowerCase().includes(query);
          const matchName = lic.user?.fullName?.toLowerCase().includes(query);
          const matchEmail = lic.user?.email?.toLowerCase().includes(query);
          if (!matchKey && !matchName && !matchEmail) return false;
        }
        if (selectedTier !== 'ALL' && lic.planType !== selectedTier) return false;

        const isExpired = Boolean(lic.expiresAt) && new Date(lic.expiresAt!) <= now;
        const isSuspended = !lic.isActive;
        const isActive = lic.isActive && !isExpired;
        const isLifetime = lic.isActive && lic.expiresAt === null;

        if (selectedStatus === 'ACTIVE' && !isActive) return false;
        if (selectedStatus === 'SUSPENDED' && !isSuspended) return false;
        if (selectedStatus === 'EXPIRED' && (!lic.isActive || !isExpired)) return false;
        if (selectedStatus === 'LIFETIME' && !isLifetime) return false;

        if (selectedCloud === 'WITH_CLOUD' && !lic.canCloudBackup) return false;
        if (selectedCloud === 'NO_CLOUD' && lic.canCloudBackup) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'XML_DESC') return b.maxXmlLimit - a.maxXmlLimit;
        if (sortBy === 'AI_DESC') return b.aiCredits - a.aiCredits;
        if (sortBy === 'EXPIRY_ASC') {
          if (!a.expiresAt) return 1;
          if (!b.expiresAt) return -1;
          return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
        }
        return (b.id || '').localeCompare(a.id || '');
      });
  }, [licenses, filter]);

  const isFiltered =
    Boolean(filter.searchQuery.trim()) ||
    filter.selectedTier !== 'ALL' ||
    filter.selectedStatus !== 'ALL' ||
    filter.selectedCloud !== 'ALL';

  return { filteredLicenses, isFiltered, tierOptions, statusOptions, cloudOptions, sortOptions };
}
