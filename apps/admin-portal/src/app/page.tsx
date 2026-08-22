import React from 'react';
import { Users, KeyRound, Database, Cpu, TrendingUp, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

export default function DashboardOverviewPage() {
  const stats = [
    {
      title: 'Total Users',
      value: '1,429',
      change: '+12.5% this month',
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Active Licenses',
      value: '1,180',
      change: '82% conversion rate',
      icon: KeyRound,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'Cloud Snapshots',
      value: '4,892',
      change: '14.2 GB S3 Storage',
      icon: Database,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      title: 'AI Credits Used',
      value: '64,200',
      change: 'Image gen & XML mapping',
      icon: Cpu,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
  ];

  const recentRegistrations = [
    {
      id: 'usr-01',
      name: 'Oleg Kovalenko',
      email: 'oleg@smartfeed.studio',
      plan: 'ENTERPRISE',
      status: 'Active',
      date: '2 minutes ago',
    },
    {
      id: 'usr-02',
      name: 'Elena Rostova',
      email: 'elena@ecom-store.com',
      plan: 'PRO',
      status: 'Active',
      date: '45 minutes ago',
    },
    {
      id: 'usr-03',
      name: 'Alexandre Dubois',
      email: 'alex@feedmaster.fr',
      plan: 'FREE',
      status: 'Active',
      date: '3 hours ago',
    },
    {
      id: 'usr-04',
      name: 'Marta Nowak',
      email: 'marta@promoceny.pl',
      plan: 'PRO',
      status: 'Active',
      date: '1 day ago',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">System Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time telemetry, license management, and CQRS service health.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            Download Report
          </Button>
          <Button size="sm" className="gap-2">
            <KeyRound className="w-4 h-4" /> Issue License
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {item.title}
                </span>
                <div
                  className={`w-8 h-8 rounded-lg ${item.bg} ${item.color} flex items-center justify-center`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white mt-3">{item.value}</div>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>{item.change}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Architecture & Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Users Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Users & Provisioned Licenses</CardTitle>
                <CardDescription>
                  Automatically provisioned via CQRS EventBus (`UserCreatedEvent`)
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="py-3 px-2">User</th>
                    <th className="py-3 px-2">Plan</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentRegistrations.map((user) => (
                    <tr key={user.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3.5 px-2">
                        <div className="font-medium text-foreground">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </td>
                      <td className="py-3.5 px-2">
                        <Badge
                          variant={
                            user.plan === 'ENTERPRISE'
                              ? 'default'
                              : user.plan === 'PRO'
                                ? 'success'
                                : 'secondary'
                          }
                        >
                          {user.plan}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-2">
                        <Badge variant="success">{user.status}</Badge>
                      </td>
                      <td className="py-3.5 px-2 text-xs text-muted-foreground">{user.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Infrastructure Topology Card */}
        <Card>
          <CardHeader>
            <CardTitle>Infrastructure Health</CardTitle>
            <CardDescription>Docker stack & microservices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <div className="text-xs font-semibold text-foreground">PostgreSQL 16</div>
                  <div className="text-[11px] text-muted-foreground">Port 5432 • Healthy</div>
                </div>
              </div>
              <Badge variant="outline">Primary DB</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <div className="text-xs font-semibold text-foreground">Redis 7 & BullMQ</div>
                  <div className="text-[11px] text-muted-foreground">
                    Port 6379 • 0 delayed jobs
                  </div>
                </div>
              </div>
              <Badge variant="outline">Queue</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <div className="text-xs font-semibold text-foreground">MinIO S3 Storage</div>
                  <div className="text-[11px] text-muted-foreground">smartfeed-storage</div>
                </div>
              </div>
              <Badge variant="outline">Presigned URLs</Badge>
            </div>

            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs space-y-1.5">
              <div className="font-semibold text-primary flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> CQRS Architecture Active
              </div>
              <p className="text-muted-foreground text-[11px]">
                AuthModule and UsersModule communicate asynchronously through CommandBus and
                EventBus without direct tight coupling.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
