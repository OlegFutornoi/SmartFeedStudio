# The Expand / Contract Migration Pattern

## 1. Чому наївні міграції ламають продакшен

Під час Zero-Downtime розгортання стара версія коду (v1) та нова версія коду (v2) працюють одночасно кілька хвилин або годин (Rolling Update).

- Якщо v2 перейменовує колонку `full_name` -> `name`, запити від v1 негайно почнуть падати з помилкою `column "full_name" does not exist`.
- Якщо v2 додає обов'язкову колонку `NOT NULL` без значення за замовчуванням, інсерти від v1 падатимуть з помилкою `null value in column violates not-null constraint`.

## 2. Три фази безпечної міграції (Expand -> Backfill -> Contract)

### Фаза 1: Expand (Реліз N)

1. **База даних**: Створюємо нову колонку як `NULLABLE`:
   ```sql
   ALTER TABLE users ADD COLUMN name TEXT;
   ```
2. **Код Prisma / NestJS**: Код починає читати зі старого поля, але пише в обидва (Dual-Write):
   ```typescript
   // При створенні або оновленні:
   await prisma.user.create({
     data: {
       fullName: dto.name,
       name: dto.name, // Dual-write
     },
   });
   ```

### Фаза 2: Backfill (Між релізами)

Фоновий скрипт порціями переносить старі дані:

```sql
UPDATE users SET name = full_name WHERE name IS NULL AND id IN (...);
```

### Фаза 3: Contract (Реліз N+1)

1. **Код Prisma / NestJS**: Код перемикається повністю на читання та запис нової колонки `name`. Стара колонка `fullName` стає позначена як `@deprecated` або ігнорується в коді.
2. **База даних (Реліз N+2)**: Стара колонка безпечно видаляється після того, як v1 повністю виведена з експлуатації:
   ```sql
   ALTER TABLE users DROP COLUMN full_name;
   ```

## 3. Чеклист для Prisma Schema

- [ ] Не видаляти поля зі `schema.prisma`, поки стара версія бекенду знаходиться в процесі зупинки.
- [ ] Використовувати `@map("snake_case")` для збереження узгодженості назв у PostgreSQL.
- [ ] Перевіряти зворотну сумісність DTO перед випуском міграції.
