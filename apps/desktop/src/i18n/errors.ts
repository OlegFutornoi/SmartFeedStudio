export function getErrorMessage(error: unknown, t: (key: string) => string): string {
  if (!error) return '';

  const rawMessage = error instanceof Error ? error.message : String(error);

  const direct = t(`errors.${rawMessage}`);
  if (direct && direct !== `errors.${rawMessage}` && direct !== rawMessage) {
    return direct;
  }

  const directNoNs = t(rawMessage);
  if (directNoNs && directNoNs !== rawMessage && directNoNs !== `errors.${rawMessage}`) {
    return directNoNs;
  }

  const lower = rawMessage.toLowerCase();

  if (
    lower.includes('authentication token is missing or invalid') ||
    lower.includes('jwt expired') ||
    lower.includes('token expired') ||
    lower.includes('invalid token') ||
    lower.includes('unauthorized') ||
    lower.includes('401')
  ) {
    return t('errors.unauthorized');
  }

  if (
    lower.includes('invalid email or password') ||
    lower.includes('invalid credentials') ||
    lower.includes('wrong password')
  ) {
    return t('errors.invalidCredentials');
  }

  if (lower.includes('already exists') || lower.includes('409')) {
    return t('errors.userAlreadyExists');
  }

  if (lower.includes('email must be an email') || lower.includes('invalid email')) {
    return t('errors.invalidEmail');
  }

  if (lower.includes('password must be longer') || lower.includes('at least 8')) {
    return t('errors.passwordTooShort');
  }

  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('econnrefused')
  ) {
    return t('errors.networkError');
  }

  if (lower.includes('500') || lower.includes('internal server error')) {
    return t('errors.serverError');
  }

  if (
    lower.includes('password reset instructions') ||
    lower.includes('not found') ||
    lower.includes('user not found') ||
    lower.includes('usernotfound')
  ) {
    return t('errors.userNotFound');
  }

  return rawMessage;
}
