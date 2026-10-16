# Golden Path: Table Numeric Cell with Clean Value (`UI-05`, `UI-06`)

```tsx
// apps/desktop/src/modules/suppliers/components/list/SupplierTableRow.tsx
import { TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// Table head already defines what the column represents (e.g. "Активні фіди" / "Active Feeds").
// In cells: render clean numeric Badge or tabular numerals. Never append noun strings ("фідів", "товарів").
export function SupplierActiveFeedsCell({ activeFeedsCount }: { activeFeedsCount?: number }) {
  const count = activeFeedsCount || 0;
  return (
    <TableCell className="text-center">
      <Badge variant="secondary" className="font-mono text-xs tabular-nums px-2 py-0.5">
        {count}
      </Badge>
    </TableCell>
  );
}
```
