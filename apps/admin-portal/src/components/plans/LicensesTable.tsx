'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { AdminLicenseItemDto } from '@smartfeed/shared';
import { Key, Cloud, SearchX } from 'lucide-react';
import { LicensesTableToolbar } from './LicensesTableToolbar';
import { FacetedOption } from './LicensesFacetedFilter';

interface LicensesTableProps {
  licenses: AdminLicenseItemDto[];
  isUk: boolean;
}

export function LicensesTable({ licenses, isUk }: LicensesTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCloud, setSelectedCloud] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');

  // Plan Tier Faceted Options with dynamic counts
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
        .map((tier) => ({
          value: tier,
          label: tier,
          count: counts[tier] || 0,
        })),
    ];
  }, [licenses, isUk]);

  // Status Faceted Options with dynamic counts
  const statusOptions: FacetedOption[] = useMemo(() => {
    const now = new Date();
    let activeCount = 0;
    let expiredCount = 0;
    let lifetimeCount = 0;

    licenses.forEach((lic) => {
      const isExp = !lic.isActive || (Boolean(lic.expiresAt) && new Date(lic.expiresAt!) <= now);
      if (isExp) {
        expiredCount += 1;
      } else {
        activeCount += 1;
      }
      if (lic.expiresAt === null) {
        lifetimeCount += 1;
      }
    });

    return [
      { value: 'ALL', label: isUk ? 'Всі статуси' : 'All Statuses', count: licenses.length },
      { value: 'ACTIVE', label: isUk ? 'Активні' : 'Active', count: activeCount },
      { value: 'EXPIRED', label: isUk ? 'Закінчилися' : 'Expired', count: expiredCount },
      { value: 'LIFETIME', label: isUk ? 'Безстрокові' : 'Lifetime', count: lifetimeCount },
    ];
  }, [licenses, isUk]);

  // Cloud Faceted Options with dynamic counts
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

  const isFiltered =
    Boolean(searchQuery.trim()) ||
    selectedTier !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedCloud !== 'ALL';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedTier('ALL');
    setSelectedStatus('ALL');
    setSelectedCloud('ALL');
    setSortBy('NEWEST');
  };

  // Filter and sort licenses
  const filteredLicenses = useMemo(() => {
    const now = new Date();
    const query = searchQuery.toLowerCase().trim();

    return licenses
      .filter((lic) => {
        // Text search matching key, user name, email
        if (query) {
          const matchKey = lic.licenseKey?.toLowerCase().includes(query);
          const matchName = lic.user?.fullName?.toLowerCase().includes(query);
          const matchEmail = lic.user?.email?.toLowerCase().includes(query);
          if (!matchKey && !matchName && !matchEmail) return false;
        }

        // Tier filter
        if (selectedTier !== 'ALL' && lic.planType !== selectedTier) {
          return false;
        }

        // Status filter
        const isExp = !lic.isActive || (Boolean(lic.expiresAt) && new Date(lic.expiresAt!) <= now);
        const isLifetime = lic.expiresAt === null;

        if (selectedStatus === 'ACTIVE') {
          if (isExp) return false;
        } else if (selectedStatus === 'EXPIRED') {
          if (!isExp) return false;
        } else if (selectedStatus === 'LIFETIME') {
          if (!isLifetime) return false;
        }

        // Cloud filter
        if (selectedCloud === 'WITH_CLOUD' && !lic.canCloudBackup) return false;
        if (selectedCloud === 'NO_CLOUD' && lic.canCloudBackup) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'XML_DESC') {
          return b.maxXmlLimit - a.maxXmlLimit;
        }
        if (sortBy === 'AI_DESC') {
          return b.aiCredits - a.aiCredits;
        }
        if (sortBy === 'EXPIRY_ASC') {
          if (!a.expiresAt) return 1;
          if (!b.expiresAt) return -1;
          return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
        }
        // Default: NEWEST (by id / created)
        return (b.id || '').localeCompare(a.id || '');
      });
  }, [licenses, searchQuery, selectedTier, selectedStatus, selectedCloud, sortBy]);

  return (
    <Card
      data-testid="licenses-table-card"
      className="border-border bg-card shadow-sm overflow-hidden"
    >
      <CardHeader className="pb-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Key className="size-4 text-muted-foreground" />
          <CardTitle data-testid="licenses-table-title" className="text-base font-semibold">
            {isUk ? 'Видані ліцензійні ключі' : 'Active Issued Licenses'}
          </CardTitle>
        </div>
        <CardDescription className="text-xs">
          {isUk
            ? 'Керування та фільтрація ліцензій клієнтів за тарифом, статусом дії та квотами'
            : 'Manage and filter customer licenses by plan tier, validity status, and quotas'}
        </CardDescription>
      </CardHeader>

      {/* Toolbar with Search, Faceted Filters & Reset */}
      <LicensesTableToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTier={selectedTier}
        onTierChange={setSelectedTier}
        tierOptions={tierOptions}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        statusOptions={statusOptions}
        selectedCloud={selectedCloud}
        onCloudChange={setSelectedCloud}
        cloudOptions={cloudOptions}
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortOptions={sortOptions}
        totalCount={licenses.length}
        filteredCount={filteredLicenses.length}
        isFiltered={isFiltered}
        onResetFilters={handleResetFilters}
        isUk={isUk}
      />

      <CardContent className="p-0">
        <Table data-testid="licenses-table">
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs">{isUk ? 'Ліцензійний ключ' : 'License Key'}</TableHead>
              <TableHead className="text-xs">{isUk ? 'Користувач' : 'User'}</TableHead>
              <TableHead className="text-xs">{isUk ? 'Тарифний план' : 'Plan Tier'}</TableHead>
              <TableHead className="text-xs">{isUk ? 'Ліміт XML' : 'XML Limit'}</TableHead>
              <TableHead className="text-xs">{isUk ? 'AI Кредити' : 'AI Credits'}</TableHead>
              <TableHead className="text-xs">{isUk ? 'Хмарний бекап' : 'Cloud Backup'}</TableHead>
              <TableHead className="text-right text-xs">
                {isUk ? 'Термін дії' : 'Expires At'}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLicenses.length === 0 ? (
              <TableRow data-testid="licenses-empty-row">
                <TableCell colSpan={7} className="text-center py-10">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto text-muted-foreground">
                    <SearchX className="size-8 text-muted-foreground/50" />
                    <p className="text-xs font-medium text-foreground">
                      {isUk
                        ? 'Жодної ліцензії за обраними фільтрами не знайдено'
                        : 'No licenses match your selected filters'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {isUk
                        ? 'Спробуйте змінити пошуковий запит або скинути активні фільтри.'
                        : 'Try adjusting your search terms or clearing active filters.'}
                    </p>
                    {isFiltered && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        data-testid="licenses-empty-reset-btn"
                        onClick={handleResetFilters}
                        className="mt-2 h-7 text-xs"
                      >
                        {isUk ? 'Скинути фільтри' : 'Clear Filters'}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredLicenses.map((lic) => (
                <TableRow
                  key={lic.id}
                  data-testid={`license-row-${lic.licenseKey}`}
                  className="hover:bg-muted/40 transition-colors"
                >
                  <TableCell className="font-mono text-xs font-semibold text-foreground">
                    <span
                      data-testid={`license-key-badge-${lic.licenseKey}`}
                      className="p-1 px-1.5 rounded bg-muted/40 border border-border/50"
                    >
                      {lic.licenseKey}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="flex flex-col">
                      <span
                        data-testid={`license-user-name-${lic.licenseKey}`}
                        className="font-medium text-foreground"
                      >
                        {lic.user?.fullName || 'User'}
                      </span>
                      <span
                        data-testid={`license-user-email-${lic.licenseKey}`}
                        className="text-[11px] text-muted-foreground font-mono"
                      >
                        {lic.user?.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      data-testid={`license-plan-badge-${lic.licenseKey}`}
                      className="text-[10px] font-mono"
                    >
                      {lic.tariffPlanNameUk || lic.planType}
                    </Badge>
                  </TableCell>
                  <TableCell
                    data-testid={`license-xml-limit-${lic.licenseKey}`}
                    className="text-xs text-muted-foreground font-mono"
                  >
                    {lic.maxXmlLimit.toLocaleString()}
                  </TableCell>
                  <TableCell
                    data-testid={`license-ai-credits-${lic.licenseKey}`}
                    className="text-xs text-muted-foreground font-mono"
                  >
                    {lic.aiCredits.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {lic.canCloudBackup ? (
                      <Badge
                        variant="secondary"
                        data-testid={`license-cloud-badge-${lic.licenseKey}`}
                        className="text-[10px] gap-1 px-1.5 py-0"
                      >
                        <Cloud className="size-2.5 text-muted-foreground" />
                        <span>S3 Active</span>
                      </Badge>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell
                    data-testid={`license-expiry-${lic.licenseKey}`}
                    className="text-right text-xs text-muted-foreground font-mono"
                  >
                    {lic.expiresAt
                      ? new Date(lic.expiresAt).toLocaleDateString()
                      : isUk
                        ? 'Безстроково'
                        : 'Lifetime'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
