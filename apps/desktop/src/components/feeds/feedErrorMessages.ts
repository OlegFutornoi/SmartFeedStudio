/**
 * feedErrorMessages.ts — Utility to map raw FEED_* error codes to
 * human-readable localized strings for the import wizard.
 */

type TFn = (key: string, params?: Record<string, string | number>) => string;

export function getFeedAnalysisErrorMessage(rawMessage: string, t: TFn): string {
  const msg = rawMessage;

  if (msg === 'FEED_TIMEOUT' || msg.includes('timeout') || msg.includes('504')) {
    return t('suppliers:errorFeedTimeout', {
      defaultValue:
        'Час очікування відповіді сервера фіду вичерпано. Сервер постачальника надто довго формує файл або недоступний.',
    });
  }

  if (msg === 'FEED_NOT_FOUND' || msg.includes('404')) {
    return t('suppliers:errorFeedNotFound', {
      defaultValue:
        'Фід за вказаним URL не знайдено (помилка 404). Перевірте правильність посилання.',
    });
  }

  if (msg === 'FEED_EMPTY' || msg.includes('empty')) {
    return t('suppliers:errorFeedEmpty', {
      defaultValue: 'Сервер постачальника повернув порожню відповідь. Перевірте URL-адресу.',
    });
  }

  if (
    msg === 'FEED_SERVER_ERROR' ||
    msg.includes('500') ||
    msg.includes('502') ||
    msg.includes('503')
  ) {
    return t('suppliers:errorFeedServerError', {
      defaultValue:
        'Сервер постачальника повернув помилку при спробі завантажити фід. Спробуйте пізніше.',
    });
  }

  if (
    msg === 'FEED_NETWORK_ERROR' ||
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError')
  ) {
    return t('suppliers:errorFeedNetwork', {
      defaultValue:
        'Не вдалося завантажити фід. Перевірте підключення до інтернету або доступність сервера постачальника.',
    });
  }

  return t('suppliers:errorFeedGeneric', {
    defaultValue:
      'Помилка аналізу або завантаження фіду. Перевірте URL-адресу або спробуйте завантажити файл безпосередньо.',
  });
}
