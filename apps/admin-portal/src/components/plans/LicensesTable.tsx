'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { AdminLicenseItemDto } from '@smartfeed/shared';
import { Key, Cloud } from 'lucide-react';

interface LicensesTableProps {
  licenses: AdminLicenseItemDto[];
  isUk: boolean;
}

export function LicensesTable({ licenses, isUk }: LicensesTableProps) {
  return (
    <Card
      data-testid="licenses-table-card"
      className="border-border bg-card shadow-sm overflow-hidden"
    >
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Key className="size-4 text-muted-foreground" />
          <CardTitle data-testid="licenses-table-title" className="text-base font-semibold">
            {isUk ? 'Видані ліцензійні ключі' : 'Active Issued Licenses'}
          </CardTitle>
        </div>
        <CardDescription className="text-xs">
          {isUk
            ? 'Ліцензії користувачів, згенеровані через CQRS EventBus та збережені в базі даних'
            : 'Active platform license keys generated via CQRS EventBus in database'}
        </CardDescription>
      </CardHeader>
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
            {licenses.length === 0 ? (
              <TableRow data-testid="licenses-empty-row">
                <TableCell colSpan={7} className="text-center py-6 text-xs text-muted-foreground">
                  {isUk ? 'Немає виданих ліцензій' : 'No active licenses found'}
                </TableCell>
              </TableRow>
            ) : (
              licenses.map((lic) => (
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
