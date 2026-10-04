# Bundle Size Limits & Code Splitting Architecture

## 1. Ліміти розміру бандла у SmartFeed Studio

- **Головний Initial JS Chunk**: **< 150 КБ gzip**
- **Окремі Lazy Chunks (модалки, важкі віджети)**: **< 80 КБ gzip**
- **CSS Chunks**: **< 30 КБ gzip**

## 2. Канонічний патерн Code Splitting

Важкі діалогові вікна, мапери колонок, редактори цін та графіки ніколи не повинні завантажуватися на старті сторінки:

```tsx
// Next.js (Admin Portal):
import dynamic from 'next/dynamic';

const FeedImportWizard = dynamic(() => import('@/components/feeds/FeedImportWizard'), {
  loading: () => <WizardSkeleton />,
  ssr: false, // модалка потрібна тільки при кліку клієнта
});

// React 18 / Tauri Desktop:
import { lazy, Suspense } from 'react';

const ProductVariantEditor = lazy(() => import('@/components/products/ProductVariantEditor'));

export function ProductPage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Редагувати варіанти</Button>
      {isOpen && (
        <Suspense fallback={<ModalLoadingSpinner />}>
          <ProductVariantEditor onClose={() => setIsOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
```

## 3. Чеклист імпортів (Tree-Shaking)

- ❌ `import _ from 'lodash';` -> ✅ `import debounce from 'lodash/debounce';`
- ❌ `import moment from 'moment';` -> ✅ `import { formatDistanceToNow } from 'date-fns';`
- ❌ `import * as Icons from 'lucide-react';` -> ✅ `import { Trash2, Edit } from 'lucide-react';`
