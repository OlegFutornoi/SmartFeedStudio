import React from 'react';
import { UserPlus, Filter, Download } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

export default function UsersPage() {
  const users = [
    {
      id: 'usr-8921-a',
      name: 'Oleg Kovalenko',
      email: 'oleg@smartfeed.studio',
      role: 'SUPER_ADMIN',
      plan: 'ENTERPRISE',
      snapshots: 18,
      status: 'Active',
      joined: '2026-08-01',
    },
    {
      id: 'usr-8922-b',
      name: 'Dmytro Petrenko',
      email: 'dmytro@ecom-ua.net',
      role: 'USER',
      plan: 'PRO',
      snapshots: 4,
      status: 'Active',
      joined: '2026-08-10',
    },
    {
      id: 'usr-8923-c',
      name: 'Anna Shevchenko',
      email: 'anna@shopmaster.ua',
      role: 'USER',
      plan: 'FREE',
      snapshots: 1,
      status: 'Active',
      joined: '2026-08-15',
    },
    {
      id: 'usr-8924-d',
      name: 'Viktor Melnyk',
      email: 'viktor@feedhub.io',
      role: 'ADMIN',
      plan: 'PRO',
      snapshots: 7,
      status: 'Active',
      joined: '2026-08-19',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Users Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage user accounts, roles, access permissions, and linked subscriptions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" /> Filter
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button size="sm" className="gap-2">
            <UserPlus className="w-4 h-4" /> Add User
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Accounts</CardTitle>
          <CardDescription>
            Entities managed in UsersModule via Prisma ORM and CQRS Command/Query Handlers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3 px-3">User & Email</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Active Plan</th>
                  <th className="py-3 px-3">Snapshots</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Registered</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-medium text-foreground">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <Badge
                        variant={
                          u.role === 'SUPER_ADMIN'
                            ? 'destructive'
                            : u.role === 'ADMIN'
                              ? 'warning'
                              : 'outline'
                        }
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-3">
                      <Badge
                        variant={
                          u.plan === 'ENTERPRISE'
                            ? 'default'
                            : u.plan === 'PRO'
                              ? 'success'
                              : 'secondary'
                        }
                      >
                        {u.plan}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-3 text-muted-foreground">{u.snapshots}</td>
                    <td className="py-3.5 px-3">
                      <Badge variant="success">{u.status}</Badge>
                    </td>
                    <td className="py-3.5 px-3 text-xs text-muted-foreground">{u.joined}</td>
                    <td className="py-3.5 px-3 text-right">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </td>
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
