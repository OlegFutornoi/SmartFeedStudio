# 🎨 Frontend Design System, Theming & Component Modularity

Detailed guidelines for semantic design tokens, shadcn UI components, solid sticky headers, and component modularity in SmartFeed Studio.

---

## 1. 🏛 Semantic Design Tokens (Zero Off-Scheme Colors)

All colors must be derived from HSL CSS variables configured in `index.css` / `globals.css`:

```tsx
// ✅ CORRECT: Pure semantic tokens & desktop rounded-lg geometry (UI-02, UI-12)
<div className="bg-card text-card-foreground border border-border/60 rounded-lg p-4">
  <h2 className="text-foreground font-semibold text-sm text-balance">Catalog Feeds</h2>
  <p className="text-muted-foreground text-xs">Manage your synchronized feeds</p>
  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
    <Plus className="size-4 mr-1.5" /> Add Feed
  </Button>
</div>

// ❌ FORBIDDEN: Hardcoded palette colors & oversized rounded-xl/2xl
<div className="bg-purple-600 text-white border-pink-400 rounded-2xl"> // STRICTLY FORBIDDEN
```

### Prohibited Palette Tokens:

- Never use `emerald-*`, `green-*`, `amber-*`, `yellow-*`, `blue-*`, `purple-*`, `violet-*`, `fuchsia-*`, `pink-*`, `indigo-*`, `cyan-*` as ad-hoc styles.
- State colors must be strictly semantic:
  - Error: `text-destructive`, `bg-destructive/10`, `border-destructive/20`
  - Success (`UI-03`): `text-success`, `bg-success/15`, `border-success/30`
  - Neutral: `text-muted-foreground`, `bg-muted`, `bg-muted/20`

---

## 2. 🪟 100% Solid Sticky Headers & Overlays

To avoid text bleed-through when scrolling large tables or lists, sticky headers **MUST ALWAYS** use solid, opaque backgrounds:

```tsx
// ✅ CORRECT: 100% Solid opaque header with solid border
<table className="w-full text-sm">
  <thead className="sticky top-0 z-10 bg-card border-b border-border shadow-xs">
    <tr>
      <th className="py-3 px-4 text-left font-medium text-muted-foreground">ID</th>
      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Name</th>
      <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
    </tr>
  </thead>
  <tbody>
    {/* rows */}
  </tbody>
</table>

// ❌ FORBIDDEN: Semi-transparent backdrop blur
<thead className="sticky top-0 z-10 bg-background/50 backdrop-blur"> // TEXT WILL BLEED THROUGH!
```

---

## 3. 🚫 Zero Duplicate Action / CTA Buttons

Never present duplicate primary action buttons simultaneously:

```tsx
export function FeedsView() {
  const { feeds, isLoading } = useFeeds();

  if (feeds.length === 0 && !isLoading) {
    return (
      <div className="space-y-4">
        {/* Top header shows title only — NO duplicate "Create Feed" button here! */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('feeds:title')}</h1>
        </div>
        {/* Single canonical CTA resides in the empty state card */}
        <FeedsEmptyState onCreateFeed={openCreateModal} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('feeds:title')}</h1>
        {/* When items exist, show action in header */}
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" /> {t('feeds:create')}
        </Button>
      </div>
      <FeedsTable feeds={feeds} />
    </div>
  );
}
```

---

## 4. 🧩 Modularity Budget & Decomposition Recipe (<250 lines)

When a page grows, immediately extract subcomponents:

```text
feeds/
├── FeedsView.tsx          # 150 lines: Layout, state dispatch, empty state switch
├── FeedsHeader.tsx        # 80 lines: Title, search input, filter pills
├── FeedsTable.tsx         # 180 lines: Table shell, pagination, solid thead
├── FeedRow.tsx            # 110 lines: Single row rendering, badge, actions dropdown
├── FeedCreateDialog.tsx   # 220 lines: Form validation, input fields, submit handler
└── useFeeds.ts            # 140 lines: React Query / useRef deduplicated data hook
```

---

## 5. ♿ Web Interface Guidelines Recipes (`web-design-guidelines`)

### A. Accessible Icon-Only Buttons & Visible Focus

```tsx
// ✅ Icon-only button with aria-label, title, and focus-visible ring
<Button
  variant="ghost"
  size="icon"
  aria-label={t('common:delete')}
  title={t('common:delete')}
  className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
  onClick={() => onDelete(item.id)}
>
  <Trash2 className="w-4 h-4 text-destructive" aria-hidden="true" />
</Button>
```

### B. Flexbox Text Truncation with `min-w-0`

```tsx
// ✅ Flex child MUST have min-w-0, otherwise truncate will fail and overflow
<div className="flex items-center gap-3 min-w-0">
  <FileText className="w-5 h-5 shrink-0 text-muted-foreground" aria-hidden="true" />
  <div className="min-w-0 flex-1">
    <p className="font-medium text-sm truncate">{feed.name}</p>
    <p className="text-xs text-muted-foreground truncate">{feed.sourceUrl}</p>
  </div>
</div>
```

### C. Numeric Table Columns with `tabular-nums`

```tsx
// ✅ tabular-nums aligns numbers cleanly across rows
<td className="py-3 px-4 text-right font-mono text-xs tabular-nums text-foreground">
  {feed.productCount.toLocaleString()}
</td>
```

### D. Accessible Forms (Never Block Paste, Clickable Labels)

```tsx
// ✅ Accessible input with htmlFor, autocomplete, inline error, paste-friendly
<div className="space-y-1.5">
  <Label htmlFor="feed-url" className="text-sm font-medium">
    {t('feeds:sourceUrl')}
  </Label>
  <Input
    id="feed-url"
    name="sourceUrl"
    type="url"
    autoComplete="url"
    spellCheck={false}
    placeholder="https://example.com/feed.xml…"
    aria-invalid={Boolean(errors.sourceUrl)}
    aria-describedby={errors.sourceUrl ? 'feed-url-error' : undefined}
    className="focus-visible:ring-2 focus-visible:ring-primary"
    // NEVER attach onPaste with preventDefault!
  />
  {errors.sourceUrl && (
    <p id="feed-url-error" className="text-xs text-destructive font-medium">
      {t(errors.sourceUrl.message)}
    </p>
  )}
</div>
```

---

## 6. ⚡ Modern High-Density Desktop Patterns (`UI-11` – `UI-15`)

### A. Unified Hairline Matrix Instead of Box-in-Box Cards (`UI-11`, `UI-15`)

```tsx
// ✅ Single outer rounded-lg card with hairline internal dividers (zero nested borders, zero gradients)
<div className="rounded-lg border border-border/60 bg-card overflow-hidden">
  <div className="px-4 py-2.5 border-b border-border/60 bg-muted/20 flex items-center justify-between">
    <h4 className="text-xs font-semibold text-foreground">{t('suppliers:title')}</h4>
    <Badge variant="outline" className="border-success/30 bg-success/15 text-success text-3xs">
      {t('suppliers:ready')}
    </Badge>
  </div>
  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border/50">
    {items.map((item, idx) => (
      <div key={item.id} className={`p-3.5 ${idx >= 2 ? 'sm:border-t sm:border-border/50' : ''}`}>
        {/* Clean slot content with neutral text-muted-foreground icons */}
      </div>
    ))}
  </div>
</div>
```

### B. Restrained Multi-Select Matrix — Zero Accent Flood (`UI-13`, `UI-14`)

```tsx
// ✅ Selected items use neutral high-contrast elevation; bg-primary is reserved strictly for the main footer CTA
<Button
  type="button"
  variant="outline"
  onClick={() => toggleCategory(cat.id)}
  className={`h-auto justify-between px-2.5 py-2 rounded-md text-left text-xs font-normal transition-colors ${
    isSelected
      ? 'bg-card border-foreground/30 text-foreground font-medium hover:bg-muted/30 shadow-2xs'
      : 'bg-muted/15 border-border/50 text-muted-foreground hover:bg-muted/30 hover:text-foreground opacity-75'
  }`}
>
  <div className="flex items-center gap-2 min-w-0 flex-1">
    <div
      className={`size-4 rounded-sm flex items-center justify-center shrink-0 ${
        isSelected ? 'bg-foreground text-background' : 'border border-border bg-background'
      }`}
    >
      {isSelected && <Check className="size-2.5 stroke-[3]" />}
    </div>
    <span className="truncate">{cat.name}</span>
  </div>
  <span className="font-mono tabular-nums text-3xs ml-1.5 px-1.5 py-0.5 rounded-sm bg-muted/70 text-foreground shrink-0">
    {cat.productCount} SKU
  </span>
</Button>
```

### C. 2-Column Control Pairing & Inline Toolbar Search (`UI-15`)

- Pair compact selector cards and policy notices side-by-side (`grid grid-cols-1 md:grid-cols-12 gap-3`) so policy cards are never pushed off-screen at the bottom of a wizard step.
- Place collection search inputs (`h-7 w-48 sm:w-56`) directly inside the card header toolbar (`px-3.5 py-2 border-b border-border/60 bg-muted/20`) alongside bulk actions (`Select All` / `Deselect All`) instead of wasting a full vertical row.
