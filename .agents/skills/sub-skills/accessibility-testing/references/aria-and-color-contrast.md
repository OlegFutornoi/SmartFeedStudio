# ARIA Labels, Screen Readers & Color Contrast Auditing

## 1. Захист від кнопок-іконок без текстового імені

Будь-який інтерактивний елемент без видимого тексту повинен мати `aria-label`:

```tsx
// ❌ ПОМИЛКА: Скрінрідер прочитає "button" без назви
<Button variant="ghost" onClick={handleDelete}>
  <Trash2 className="w-4 h-4" />
</Button>

// ✅ ПРАВИЛЬНО: Повна локалізація імені дії
<Button
  variant="ghost"
  onClick={handleDelete}
  aria-label={t('common:deleteItem')}
  title={t('common:deleteItem')}
>
  <Trash2 className="w-4 h-4" />
</Button>
```

## 2. Робота з динамічними станами (`aria-expanded`, `aria-busy`)

- Акордеони та дропдауни: `aria-expanded={isOpen}`
- Таблиці під час завантаження: `aria-busy={isLoading}`
- Форми з помилками: `aria-invalid={!!errors.field}` та `aria-describedby="field-error-id"`

## 3. Аудит контрастності кольорів (WCAG 2.1 AA)

- Нормальний текст (<18pt / <24px): **мінімум 4.5:1**
- Великий текст (≥18pt або bold ≥14pt): **мінімум 3.0:1**
- Елементи інтерфейсу та іконки (UI components): **мінімум 3.0:1**

```typescript
// Playwright перевірка контрастності через axe-core:
const results = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();

expect(results.violations).toEqual([]);
```
