import { ForgotPasswordForm } from '@/components/forgot-password-form';
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';

export function ForgotPasswordPage() {
  return (
    <AuthSplitLayout testId="forgot-password-page">
      <ForgotPasswordForm />
    </AuthSplitLayout>
  );
}
