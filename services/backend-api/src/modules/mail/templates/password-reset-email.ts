export interface PasswordResetEmailData {
  to: string;
  userName?: string;
  resetUrl: string;
  expiresInMinutes?: number;
}

export function generatePasswordResetEmailHtml(data: PasswordResetEmailData): string {
  const expiry = data.expiresInMinutes || 15;
  const greeting = data.userName ? `Вітаємо, ${data.userName}!` : 'Вітаємо!';

  return `
<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Відновлення пароля — SmartFeed Studio</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #090d16;
      color: #f1f5f9;
      margin: 0;
      padding: 32px 16px;
    }
    .card {
      max-width: 560px;
      margin: 0 auto;
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;
    }
    .logo-badge {
      background: #0ea5e9;
      color: #ffffff;
      font-weight: 700;
      font-size: 14px;
      padding: 4px 10px;
      border-radius: 6px;
      display: inline-block;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #f8fafc;
      margin-top: 16px;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 14px;
      color: #94a3b8;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .btn {
      display: inline-block;
      background: #0ea5e9;
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
      padding: 12px 28px;
      border-radius: 8px;
      margin: 20px 0;
      text-align: center;
    }
    .btn:hover {
      background: #0284c7;
    }
    .notice {
      background: #1e293b;
      border-left: 4px solid #0ea5e9;
      padding: 12px 16px;
      border-radius: 4px;
      font-size: 13px;
      color: #cbd5e1;
      margin-top: 20px;
      line-height: 1.5;
    }
    .footer {
      font-size: 12px;
      color: #64748b;
      margin-top: 32px;
      border-top: 1px solid #1f2937;
      padding-top: 16px;
      text-align: center;
    }
    .url-fallback {
      font-family: monospace;
      font-size: 12px;
      word-break: break-all;
      color: #38bdf8;
      margin-top: 8px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <span class="logo-badge">SmartFeed Studio</span>
    </div>

    <div class="title">Запит на зміну пароля / Password Reset Request</div>
    <div class="subtitle">
      ${greeting}<br>
      Ми отримали запит на скидання пароля для вашого облікового запису (${data.to}). Посилання дійсне протягом <strong>${expiry} хвилин</strong>.
    </div>

    <div style="text-align: center;">
      <a href="${data.resetUrl}" class="btn" target="_blank" rel="noopener noreferrer">
        Скинути пароль (Reset Password)
      </a>
    </div>

    <div class="notice">
      Якщо ви не надсилали цей запит, просто проігноруйте цей лист. Ваш пароль залишиться незмінним, а обліковий запис у безпеці.<br>
      <em>If you did not request this, please ignore this email.</em>
    </div>

    <div style="margin-top: 20px; font-size: 12px; color: #94a3b8;">
      Якщо кнопка не спрацьовує, скопіюйте це посилання у браузер:<br>
      <div class="url-fallback">${data.resetUrl}</div>
    </div>

    <div class="footer">
      &copy; ${new Date().getFullYear()} SmartFeed Studio. All rights reserved.
    </div>
  </div>
</body>
</html>
`;
}
