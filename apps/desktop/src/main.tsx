import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { LicenseProvider } from '@/contexts/LicenseContext';
import { QuotasProvider } from '@/contexts/QuotasContext';
import { BackgroundJobsProvider } from '@/contexts/BackgroundJobsContext';
import { I18nProvider } from '@/i18n';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <BrowserRouter>
    <I18nProvider>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <LicenseProvider>
            <QuotasProvider>
              <BackgroundJobsProvider>
                <App />
              </BackgroundJobsProvider>
            </QuotasProvider>
          </LicenseProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  </BrowserRouter>,
);
