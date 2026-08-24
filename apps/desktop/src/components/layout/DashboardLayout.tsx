import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { NavigationProvider } from '@/contexts/NavigationContext';

export function DashboardLayout({ children }: { children?: React.ReactNode }) {
  return (
    <SidebarProvider>
      <NavigationProvider>
        <div className="flex min-h-screen bg-background text-foreground antialiased selection:bg-primary/30">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 p-6 md:p-10 overflow-y-auto">{children || <Outlet />}</main>
          </div>
        </div>
      </NavigationProvider>
    </SidebarProvider>
  );
}
