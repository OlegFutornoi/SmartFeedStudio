import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLicense } from '@/hooks/useLicense';
import { ExpiredPlanBlocker } from '@/components/layout/ExpiredPlanBlocker';
import { UserSuspendedBlocker } from '@/components/layout/UserSuspendedBlocker';
import { SpotlightBlurBackdrop } from '@/components/layout/SpotlightBlurBackdrop';
import { GlobalJobProgressBar } from '@/components/ui/GlobalJobProgressBar';
import { FirstRunWorkspaceSetupDialog } from '@/components/storage/FirstRunWorkspaceSetupDialog';

export function DashboardLayout({ children }: { children?: React.ReactNode }) {
  const { isSuspended, user } = useAuth();
  const { isExpired, isLoading } = useLicense();
  const location = useLocation();

  const isUserSuspended = isSuspended || user?.isActive === false;

  // Allow access to /plans and /settings even when license is expired or missing
  const isAllowedPath = ['/plans', '/settings'].includes(location.pathname);
  const isLicenseBlocked = !isLoading && isExpired && !isAllowedPath;

  return (
    <SidebarProvider>
      <NavigationProvider>
        {/* Full layout: when suspended, completely deactivated and fully blurred behind SpotlightBlurBackdrop */}
        <div
          className={`flex min-h-screen bg-muted/40 dark:bg-card/30 text-foreground antialiased ${
            isUserSuspended ? 'pointer-events-none select-none' : 'selection:bg-primary/30'
          }`}
          aria-hidden={isUserSuspended ? 'true' : undefined}
          data-testid="dashboard-layout-container"
        >
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 md:m-2 md:ml-0 md:rounded-xl md:border md:border-border/80 md:shadow-xs bg-background overflow-hidden">
            <Header />
            <main className="flex-1 p-4 sm:p-6 lg:p-7 overflow-y-auto">
              {isLicenseBlocked && !isUserSuspended ? (
                <ExpiredPlanBlocker />
              ) : (
                children || <Outlet />
              )}
            </main>
          </div>
          <GlobalJobProgressBar />
          {!isUserSuspended && <FirstRunWorkspaceSetupDialog />}
        </div>

        {/* Full-screen Spotlight Backdrop covering 100% of the viewport (Sidebar, Header, Content) */}
        {isUserSuspended && (
          <SpotlightBlurBackdrop>
            <UserSuspendedBlocker />
          </SpotlightBlurBackdrop>
        )}
      </NavigationProvider>
    </SidebarProvider>
  );
}
