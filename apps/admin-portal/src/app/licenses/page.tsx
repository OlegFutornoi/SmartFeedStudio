import React from 'react';
import { KeyRound, CheckCircle2, Zap } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

export default function LicensesPage() {
  const plans = [
    {
      name: 'FREE',
      price: '$0',
      description: 'Default plan automatically assigned on user registration via EventBus.',
      features: [
        'Max 1,000 XML Catalog Items',
        '50 AI Credits / month',
        'Local SQLite caching & storage',
        'Manual exports',
      ],
      badgeVariant: 'secondary' as const,
      popular: false,
    },
    {
      name: 'PRO',
      price: '$49',
      period: '/month',
      description: 'For growing e-commerce businesses managing multi-vendor feeds.',
      features: [
        'Max 50,000 XML Catalog Items',
        '500 AI Credits / month',
        'Cloud Backup & S3 Presigned Sync',
        'Automated BullMQ background scheduling',
        'OS Keychain token integration',
      ],
      badgeVariant: 'success' as const,
      popular: true,
    },
    {
      name: 'ENTERPRISE',
      price: '$199',
      period: '/month',
      description:
        'Dedicated infrastructure with high-throughput XML parsing and dedicated support.',
      features: [
        'Max 1,000,000 XML Catalog Items',
        '5,000 AI Credits / month',
        'Unlimited S3 Cloud Snapshots',
        'Custom R2 / MinIO storage endpoints',
        'Multi-seat admin roles',
      ],
      badgeVariant: 'default' as const,
      popular: false,
    },
  ];

  const activeLicenses = [
    {
      key: 'SF-ENTERPRISE-8F29-A01B-C3D4',
      user: 'Oleg Kovalenko (oleg@smartfeed.studio)',
      plan: 'ENTERPRISE',
      xmlLimit: '1,000,000',
      aiCredits: '5,000',
      backup: 'Enabled',
      expires: 'Perpetual',
    },
    {
      key: 'SF-PRO-1142-99AB-EE01',
      user: 'Elena Rostova (elena@ecom-store.com)',
      plan: 'PRO',
      xmlLimit: '50,000',
      aiCredits: '500',
      backup: 'Enabled',
      expires: '2027-08-22',
    },
    {
      key: 'SF-FREE-0019-FE88-921A',
      user: 'Alexandre Dubois (alex@feedmaster.fr)',
      plan: 'FREE',
      xmlLimit: '1,000',
      aiCredits: '50',
      backup: 'Disabled',
      expires: 'Perpetual',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Licenses & Tier Plans</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage subscription tiers, feature caps, and active license keys.
          </p>
        </div>
        <Button size="sm" className="gap-2">
          <KeyRound className="w-4 h-4" /> Generate Custom License
        </Button>
      </div>

      {/* Plan Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative flex flex-col justify-between ${
              plan.popular ? 'border-primary shadow-lg shadow-primary/10' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 right-6 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3 fill-current" /> Popular Choice
              </div>
            )}
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <Badge variant={plan.badgeVariant}>{plan.name}</Badge>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white">{plan.price}</span>
                {plan.period && (
                  <span className="text-xs text-muted-foreground">{plan.period}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">{plan.description}</p>

              <div className="mt-6 space-y-2.5">
                {plan.features.map((feat) => (
                  <div key={feat} className="flex items-center gap-2 text-xs text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <Button variant={plan.popular ? 'default' : 'outline'} size="sm" className="w-full">
                Configure {plan.name}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Active License Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle>Issued License Keys</CardTitle>
          <CardDescription>Licenses generated and validated by LicensesModule</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3 px-3">License Key</th>
                  <th className="py-3 px-3">Assigned User</th>
                  <th className="py-3 px-3">Plan</th>
                  <th className="py-3 px-3">XML Limit</th>
                  <th className="py-3 px-3">AI Credits</th>
                  <th className="py-3 px-3">Cloud Backup</th>
                  <th className="py-3 px-3">Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activeLicenses.map((lic) => (
                  <tr key={lic.key} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-3.5 px-3 font-mono text-xs text-primary font-semibold">
                      {lic.key}
                    </td>
                    <td className="py-3.5 px-3 text-xs text-foreground">{lic.user}</td>
                    <td className="py-3.5 px-3">
                      <Badge
                        variant={
                          lic.plan === 'ENTERPRISE'
                            ? 'default'
                            : lic.plan === 'PRO'
                              ? 'success'
                              : 'secondary'
                        }
                      >
                        {lic.plan}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-3 text-xs text-muted-foreground">{lic.xmlLimit}</td>
                    <td className="py-3.5 px-3 text-xs text-muted-foreground">{lic.aiCredits}</td>
                    <td className="py-3.5 px-3">
                      <Badge variant={lic.backup === 'Enabled' ? 'success' : 'outline'}>
                        {lic.backup}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-3 text-xs text-muted-foreground">{lic.expires}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
