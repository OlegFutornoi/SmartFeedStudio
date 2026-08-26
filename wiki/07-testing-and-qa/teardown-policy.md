# 🧹 Політика Ізоляції та Очищення Тестових Даних (Zero Leftovers)

## 📌 Чому "Нульові Залишки" критично важливі?

У великих проектах з інтеграційними тестами залишкові записи в базі даних (тестові користувачі, підписки, тимчасові файли) призводять до:

- Падіння повторних тестів через колізії унікальних полів (`unique constraint failed on email`).
- Засмічення локальної БД розробника та серверів CI/CD.
- Витоку стану між окремими тест-кейсами (Flaky Tests).

---

## 🛡 Правила для Бекенд-Тестів (`*.e2e-spec.ts`)

Кожен файл E2E тестів **зобов'язаний** мати блок `afterAll` з повним очищенням:

```typescript
afterAll(async () => {
  // 1. Очищення за збереженими масивами створених сутностей
  if (createdEmails.length > 0) {
    await prisma.license.deleteMany({ where: { user: { email: { in: createdEmails } } } });
    await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
  }

  // 2. Додаткове очищення за патернами тестових префіксів
  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { startsWith: 'e2e.test+' } },
        { email: { startsWith: 'admintest-' } },
        { email: { contains: '.lic.test@' } },
      ],
    },
  });

  // 3. Відновлення базових налаштувань планів (якщо змінювались у тестах)
  await prisma.tariffPlan.updateMany({
    where: { code: 'STARTER' },
    data: { durationDays: 7 },
  });

  await app.close();
});
```

---

## 🌐 Правила для Фронтенд-Тестів (Playwright)

У кожному файлі `*.spec.ts` блок `beforeEach` повинен гарантувати чисте браузерне середовище:

```typescript
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  // Реєстрація чистих route моків без збереження стану
});
```
