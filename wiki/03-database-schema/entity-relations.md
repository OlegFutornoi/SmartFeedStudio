# 🔗 Зв'язки Сутностей (ERD) та Каскадні Правила

## 📌 Діаграма зв'язків сутностей (Entity-Relationship Diagram)

```mermaid
erDiagram
    User ||--o{ License : "має (1 до N, активна 1)"
    User ||--o{ Snapshot : "володіє бекапами"
    User ||--o{ ProductImage : "зберігає зображення"
    User ||--o{ Organization : "є власником (owner)"
    User ||--o{ OrganizationMember : "членство в компаніях"
    User ||--o{ OrganizationInvitation : "створені інвайти"

    Organization ||--o{ OrganizationMember : "має співробітників"
    Organization ||--o{ OrganizationInvitation : "має відкриті інвайти"
    Organization ||--o{ License : "корпоративна ліцензія"

    TariffPlan ||--o{ License : "задає квоти та тривалість"

    User {
        string id PK
        string email UK
        string passwordHash
        string fullName
        Role role
        string resetToken
        datetime resetTokenExpiry
        datetime createdAt
    }

    Organization {
        string id PK
        string name
        string slug UK
        string ownerId FK
        datetime createdAt
    }

    OrganizationMember {
        string id PK
        string organizationId FK
        string userId FK
        MemberRole role
        datetime joinedAt
    }

    OrganizationInvitation {
        string id PK
        string organizationId FK
        string invitedById FK
        string email
        MemberRole role
        string token UK
        InvitationStatus status
        datetime expiresAt
        datetime createdAt
    }

    TariffPlan {
        string id PK
        string code UK
        string nameUk
        string nameEn
        float priceMonthly
        int maxXmlLimit
        int aiCredits
        int maxTeamSeats
        boolean canCloudBackup
        int durationDays
        string[] featuresUk
    }

    License {
        string id PK
        string userId FK
        string organizationId FK
        string tariffPlanId FK
        string licenseKey UK
        PlanType planType
        boolean canCloudBackup
        int maxXmlLimit
        int aiCredits
        int maxTeamSeats
        boolean isActive
        datetime expiresAt
    }

    NavigationItem {
        string id PK
        string key UK
        string labelUk
        string labelEn
        string path
        string icon
        int order
        boolean isVisible
        Role[] requiredRoles
        PlanType requiredPlan
        TargetApp targetApp
    }

    Snapshot {
        string id PK
        string userId FK
        string snapshotName
        string s3Key
        int sizeBytes
        datetime createdAt
    }

    ProductImage {
        string id PK
        string userId FK
        string originalUrl
        string cloudUrl
        string s3Key
    }
```

---

## 🛡 Каскадні Правила та Цілісність Даних

1. **Видалення Користувача (`User` -> `License`, `Snapshot`, `ProductImage`)**:
   - `onDelete: Cascade` налаштовано для сутностей `License`, `Snapshot`, та `ProductImage`.
   - При видаленні користувача (чи в робочому процесі, чи під час очистки тестів `afterAll`), всі пов'язані з ним ліцензії, бекапи та зображення **автоматично видаляються з PostgreSQL**, запобігаючи накопиченню осиротілих записів.

2. **Видалення Тарифного Плану (`TariffPlan` -> `License`)**:
   - `onDelete: SetNull` налаштовано для зв'язку `tariffPlanId` у моделі `License`.
   - Якщо адміністратор видаляє кастомний тарифний план, вже видані користувачам ліцензії **не втрачають працездатності** — їхній `tariffPlanId` встановлюється в `null`, але квоти (`maxXmlLimit`, `aiCredits`) та термін дії (`expiresAt`) зберігаються без змін.
