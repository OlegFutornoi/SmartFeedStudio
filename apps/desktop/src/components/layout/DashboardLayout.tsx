import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { useLicense } from '@/hooks/useLicense';
import { ExpiredPlanBlocker } from './ExpiredPlanBlocker';
import { GlobalJobProgressBar } from '@/components/ui/GlobalJobProgressBar';
import { FirstRunWorkspaceSetupDialog } from '@/components/storage/FirstRunWorkspaceSetupDialog';

export function DashboardLayout({ children }: { children?: React.ReactNode }) {
  const { isExpired, isLoading } = useLicense();
  const location = useLocation();

  // Allow access to /plans and /settings even when license is expired or missing
  const isAllowedPath = ['/plans', '/settings'].includes(location.pathname);
  const isBlocked = !isLoading && isExpired && !isAllowedPath;

  return (
    <SidebarProvider>
      <NavigationProvider>
        <div className="flex min-h-screen bg-muted/40 dark:bg-card/30 text-foreground antialiased selection:bg-primary/30">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 md:m-2 md:ml-0 md:rounded-xl md:border md:border-border/80 md:shadow-xs bg-background overflow-hidden">
            <Header />
            <main className="flex-1 p-6 md:p-8 overflow-y-auto">
              {isBlocked ? <ExpiredPlanBlocker /> : children || <Outlet />}
            </main>
          </div>
          <GlobalJobProgressBar />
          <FirstRunWorkspaceSetupDialog />
        </div>
      </NavigationProvider>
    </SidebarProvider>
  );
}
