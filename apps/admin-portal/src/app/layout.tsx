import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { HydrationMarker } from '../components/ui/hydration-marker';

export const metadata: Metadata = {
  title: 'SmartFeed Studio - Admin Portal',
  description: 'Control center for user management, licensing, and cloud synchronization.',
};

const THEME_SCRIPT = `
(function() {
  try {
    var mode = localStorage.getItem('smartfeed_theme_mode') || 'dark';
    var accent = localStorage.getItem('smartfeed_theme_accent') || 'violet';
    var root = document.documentElement;
    var resolved = mode === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    root.setAttribute('data-accent', accent);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/30">
        <AuthProvider>
          <LanguageProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
