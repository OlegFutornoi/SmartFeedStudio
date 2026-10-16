# Golden Path: Semantic Success Status Badge (`UI-02`, `UI-03`, `UI-05`)

```tsx
// apps/desktop/src/modules/suppliers/components/list/SupplierTableRow.tsx
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

// Never use hardcoded arbitrary colors: text-emerald-600, bg-emerald-500/10, bg-green-500.
// Strictly use the semantic CSS variable `--success`:
//   bg-success/15 text-success border-success/30
export function SupplierStatusBadge({ isActive }: { isActive: boolean }) {
  const { t } = useTranslation('suppliers');

  return (
    <Badge
      variant="outline"
      className={
        isActive
          ? 'bg-success/15 text-success border-success/30 font-medium'
          : 'bg-muted/40 text-muted-foreground border-border font-medium'
      }
    >
      {isActive ? t('status.active') : t('status.inactive')}
    </Badge>
  );
}
```
