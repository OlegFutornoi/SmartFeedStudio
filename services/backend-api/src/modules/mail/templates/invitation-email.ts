export interface InvitationEmailData {
  to: string;
  inviterName: string;
  organizationName: string;
  role: string;
  inviteUrl: string;
  token?: string;
  expiresAt: Date;
}

export function generateInvitationEmailHtml(data: InvitationEmailData): string {
  const roleDisplay = data.role === 'ADMIN' ? 'Адміністратор (Admin)' : 'Співробітник (Member)';
  const formattedExpires = new Date(data.expiresAt).toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Запрошення до команди SmartFeed Studio</title>
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
      border-radius: 16px;
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
      background: linear-gradient(135deg, #0ea5e9, #3b82f6);
      color: #ffffff;
      font-weight: 800;
      font-size: 14px;
      padding: 6px 12px;
      border-radius: 8px;
      display: inline-block;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 12px;
    }
    .subtitle {
      font-size: 14px;
      color: #94a3b8;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .highlight-box {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 28px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      padding: 6px 0;
      border-bottom: 1px solid #334155;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #94a3b8;
    }
    .info-value {
      color: #38bdf8;
      font-weight: 600;
    }
    .btn-container {
      text-align: center;
      margin-bottom: 28px;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #0284c7, #2563eb);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 15px;
      padding: 12px 32px;
      border-radius: 10px;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
    }
    .link-box {
      background: #0f172a;
      border: 1px dashed #334155;
      border-radius: 8px;
      padding: 12px;
      font-size: 11px;
      color: #64748b;
      word-break: break-all;
      margin-bottom: 24px;
    }
    .footer {
      font-size: 12px;
      color: #64748b;
      text-align: center;
      border-top: 1px solid #1f2937;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <span class="logo-badge">⚡ SmartFeed Studio</span>
    </div>
    <div class="title">Вас запрошено до команди!</div>
    <div class="subtitle">
      <strong>${data.inviterName}</strong> запрошує вас приєднатися до корпоративного простору компанії <strong>${data.organizationName}</strong> на платформі SmartFeed Studio.
    </div>

    <div class="highlight-box">
      <div class="info-row">
        <span class="info-label">Компанія:</span>
        <span class="info-value">${data.organizationName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Призначена роль:</span>
        <span class="info-value">${roleDisplay}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Термін дії запрошення:</span>
        <span class="info-value">до ${formattedExpires}</span>
      </div>
    </div>

    <div class="btn-container">
      <a href="${data.inviteUrl}" class="btn" target="_blank">Приєднатися до команди</a>
    </div>

    <div class="link-box">
      Якщо кнопка не працює, скопіюйте це посилання у браузер або додаток:<br>
      <a href="${data.inviteUrl}" style="color: #38bdf8;">${data.inviteUrl}</a>
    </div>

    <div class="footer">
      Якщо ви не очікували це запрошення, просто проігноруйте цей лист.<br>
      © ${new Date().getFullYear()} SmartFeed Studio. Enterprise Catalog & AI Enrichment Platform.
    </div>
  </div>
</body>
</html>
`;
}
