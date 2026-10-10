import { LoginForm } from '@/components/login-form';
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';

export function LoginPage() {
  return (
    <AuthSplitLayout testId="login-page">
      <LoginForm />
    </AuthSplitLayout>
  );
}
