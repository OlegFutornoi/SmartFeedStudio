import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { HomePage } from '@/pages/HomePage';
import { CatalogsPage } from '@/pages/CatalogsPage';
import { AiEnrichmentPage } from '@/pages/AiEnrichmentPage';
import { CloudSyncPage } from '@/pages/CloudSyncPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { PrivateRoute } from '@/components/PrivateRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function App() {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />

      {/* Protected Authenticated Routes wrapped in DashboardLayout */}
      <Route
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/catalogs" element={<CatalogsPage />} />
        <Route path="/ai-enrichment" element={<AiEnrichmentPage />} />
        <Route path="/cloud-sync" element={<CloudSyncPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback to Dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
