# 🔗 Symlink & Link Integrity — Контроль цілісності посилань

## 1. Автоматична перевірка битих симлінків у `.claude/skills/`

Для Claude Code усі скіли підключаються як відносні символічні посилання:

```bash
# Знайти всі биті симлінки (які посилаються на неіснуючі файли чи папки):
find .claude/skills -type l -exec test ! -e {} \; -print
```

Якщо команда повертає порожній вивід — усі посилання валідні.
Якщо виведено шлях — симлінк веде у неіснуюче місце і потребує оновлення або видалення.

---

## 2. Створення правильного відносного симлінка

Симлінки у `.claude/skills/` **завжди** створюються з відносним шляхом `../../.agents/skills/sub-skills/<skill-name>`:

```bash
# Правильний спосіб (відносний шлях):
cd .claude/skills && ln -s ../../.agents/skills/sub-skills/<skill-name> <skill-name>

# Категорично заборонено: абсолютні шляхи (/Users/oleg/...) — вони ламаються на інших машинах або в CI!
```

---

## 3. Перевірка внутрішніх посилань у Markdown

Усі майстер-оркестратори (`.agents/skills/backend/SKILL.md`, `.agents/skills/frontend/SKILL.md`) посилаються на підскіли за схемою:
`[назва](../sub-skills/<skill-name>/SKILL.md)`

Скрипт перевірки наявності цільових файлів:

```bash
# Перевірка наявності всіх файлів SKILL.md
for dir in .agents/skills/sub-skills/*; do
  if [ -d "$dir" ] && [ ! -f "$dir/SKILL.md" ]; then
    echo "⚠️ Відсутній SKILL.md у: $dir"
  fi
done
```
