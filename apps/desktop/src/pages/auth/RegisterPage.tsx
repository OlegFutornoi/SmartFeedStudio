import { SignupForm } from '@/components/signup-form';
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';

export function RegisterPage() {
  return (
    <AuthSplitLayout testId="register-page">
      {({ onOpenLegal }) => <SignupForm onOpenLegal={onOpenLegal} />}
    </AuthSplitLayout>
  );
}
