import React from 'react';
import { Sidebar } from '../../components/layout/sidebar';
import { Header } from '../../components/layout/header';
import { AuthGuard } from '../../components/auth/AuthGuard';
import { SidebarProvider } from '../../contexts/SidebarContext';
import { NavigationProvider } from '../../contexts/NavigationContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <NavigationProvider>
        <SidebarProvider>
          <div className="flex min-h-screen bg-muted/40 dark:bg-card/30 text-foreground antialiased selection:bg-primary/30">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 md:m-2 md:ml-0 md:rounded-xl md:border md:border-border/80 md:shadow-xs bg-background overflow-hidden">
              <Header />
              <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
            </div>
          </div>
        </SidebarProvider>
      </NavigationProvider>
    </AuthGuard>
  );
}
