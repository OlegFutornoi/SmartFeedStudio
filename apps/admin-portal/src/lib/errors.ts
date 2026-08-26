import { Locale } from '../i18n/types';
import ukErrors from '../i18n/locales/uk/errors.json';
import enErrors from '../i18n/locales/en/errors.json';

const ERROR_MAP: Record<Locale, Record<string, string>> = {
  uk: ukErrors,
  en: enErrors,
};

export function translateError(error: unknown, locale: Locale = 'uk'): string {
  if (!error) return ERROR_MAP[locale].unknown_error;

  let rawMessage = '';
  if (typeof error === 'string') {
    rawMessage = error;
  } else if (error instanceof Error) {
    rawMessage = error.message;
  } else if (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  ) {
    rawMessage = (error as Record<string, unknown>).message as string;
  }

  const lower = rawMessage.toLowerCase().trim();

  if (
    lower.includes('authentication token is missing or invalid') ||
    lower.includes('jwt expired') ||
    lower.includes('token expired') ||
    lower.includes('invalid token')
  ) {
    return ERROR_MAP[locale].auth_token_missing_or_invalid;
  }

  if (lower.includes('unauthorized') || lower.includes('not authorized')) {
    return ERROR_MAP[locale].unauthorized;
  }

  if (lower.includes('forbidden') || lower.includes('insufficient permissions')) {
    return ERROR_MAP[locale].forbidden;
  }

  if (
    lower.includes('invalid credentials') ||
    lower.includes('invalid email or password') ||
    lower.includes('wrong password')
  ) {
    return ERROR_MAP[locale].invalid_credentials;
  }

  if (lower.includes('user already exists') || lower.includes('email already registered')) {
    return ERROR_MAP[locale].user_already_exists;
  }

  if (lower.includes('failed to fetch') || lower.includes('network error')) {
    return ERROR_MAP[locale].network_error;
  }

  if (
    lower.includes('already exists') &&
    (lower.includes('code') || lower.includes('tariff') || lower.includes('plan'))
  ) {
    return ERROR_MAP[locale].plan_already_exists;
  }

  if (lower.includes('tariff plan') && lower.includes('not found')) {
    return ERROR_MAP[locale].plan_not_found;
  }

  if (lower.includes('team seats') || lower.includes('team_seats')) {
    return ERROR_MAP[locale].team_seats_limit;
  }

  if (lower.includes('supplier') || lower.includes('suppliers')) {
    return ERROR_MAP[locale].suppliers_limit;
  }

  if (lower.includes('internal server error') || lower.includes('500')) {
    return ERROR_MAP[locale].server_error;
  }

  // If already mapped directly to a key in dictionary
  if (ERROR_MAP[locale][rawMessage]) {
    return ERROR_MAP[locale][rawMessage];
  }

  return ERROR_MAP[locale].unknown_error;
}
