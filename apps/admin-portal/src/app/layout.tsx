import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '../components/layout/sidebar';
import { Header } from '../components/layout/header';

export const metadata: Metadata = {
  title: 'SmartFeed Studio - Admin Portal',
  description: 'Control center for user management, licensing, and cloud synchronization.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen bg-background text-foreground antialiased selection:bg-primary/30">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-8 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
