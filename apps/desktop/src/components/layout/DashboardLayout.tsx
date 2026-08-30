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
        <div className="flex min-h-screen bg-background text-foreground antialiased selection:bg-primary/30">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 p-6 md:p-10 overflow-y-auto">
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
