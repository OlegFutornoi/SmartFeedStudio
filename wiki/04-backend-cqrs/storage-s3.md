# ☁️ Хмарне Сховище та S3 Presigned URLs — SmartFeed Studio

## 📌 Чому Presigned URLs?

Каталоги e-commerce можуть містити сотні тисяч товарів із фотографіями та досягати сотень мегабайт. Якщо передавати файли спочатку на бекенд, а звідти в S3:

1. Бекенд блокуватиметься тривалими потоками вводу-виводу (I/O).
2. Різко зростає споживання оперативної пам'яті (RAM).
3. Збільшується ризик мережевих обривів.

**Архітектурне рішення SmartFeed Studio:**
Бекенд генерує тимчасовий авторизований URL (Presigned Upload URL), за яким клієнт вивантажує файл безпосередньо у сховище MinIO або Cloudflare R2/AWS S3.

```mermaid
sequenceDiagram
    participant Client as Desktop Клієнт
    participant API as Backend API (:4000)
    participant Guard as RequireActiveLicenseGuard
    participant MinIO as S3 / MinIO Storage (:9000)

    Client->>API: POST /api/storage/presigned-url { fileName, contentType }
    API->>Guard: Перевірка активності ліцензії
    Guard-->>API: Ліцензія активна (isExpired: false)

    API->>API: Генерація s3Key (users/{userId}/{folder}/{uuid}.ext)
    API->>API: @aws-sdk/s3-request-presigner -> PutObjectCommand (URL діє 15 хв)
    API-->>Client: 201 Created { uploadUrl, s3Key, expiresInSeconds: 900 }

    Note over Client,MinIO: Пряме завантаження без участі бекенду
    Client->>MinIO: HTTP PUT {uploadUrl} (Binary Data / Stream)
    MinIO-->>Client: 200 OK (Файл успішно збережено в бакеті)
```

---

## 🔒 Перевірка Прав Доступу

Генерація Presigned URL захищена двома рівнями:

- `JwtAuthGuard`: перевіряє валідність сесії користувача.
- `RequireActiveLicenseGuard`: перевіряє, чи не закінчився термін дії тарифного плану. Якщо план прострочено, бекенд відмовляє у видачі посилання з помилкою `403 LICENSE_EXPIRED`.
