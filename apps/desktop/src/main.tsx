import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { LicenseProvider } from '@/contexts/LicenseContext';
import { I18nProvider } from '@/i18n';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <BrowserRouter>
    <I18nProvider>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <LicenseProvider>
            <App />
          </LicenseProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nProvider>
  </BrowserRouter>,
);
