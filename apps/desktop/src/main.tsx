import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { LicenseProvider } from '@/contexts/LicenseContext';
import { QuotasProvider } from '@/contexts/QuotasContext';
import { BackgroundJobsProvider } from '@/contexts/BackgroundJobsContext';
import { WorkspaceStorageProvider } from '@/contexts/WorkspaceStorageContext';
import { I18nProvider } from '@/i18n';
import '@fontsource/inter';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import { initSentry } from '@/lib/sentry';
import App from '@/App';
import '@/index.css';

// Initialize Sentry monitoring for desktop client
initSentry();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <BrowserRouter>
    <I18nProvider>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <WorkspaceStorageProvider>
            <LicenseProvider>
              <QuotasProvider>
                <BackgroundJobsProvider>
                  <App />
                </BackgroundJobsProvider>
              </QuotasProvider>
            </LicenseProvider>
          </WorkspaceStorageProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  </BrowserRouter>,
);
