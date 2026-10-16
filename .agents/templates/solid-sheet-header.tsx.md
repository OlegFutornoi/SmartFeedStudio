# Golden Path: 100% Solid Sticky Header (`UI-01`, `UI-05`)

```tsx
// apps/desktop/src/modules/suppliers/components/drawer/SupplierDrawerHeader.tsx
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';

// Never use translucent backdrop-blur (bg-card/60 backdrop-blur-xs) without a solid backing.
// Modals, sheets, and sticky table headers must be 100% opaque solid background:
export function SupplierDrawerHeader({ name }: { name: string }) {
  return (
    <SheetHeader className="p-4 px-5 border-b border-border bg-card pr-10">
      <div className="flex items-center justify-between">
        <SheetTitle className="text-base font-semibold text-foreground">{name}</SheetTitle>
      </div>
    </SheetHeader>
  );
}
```
