import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Package, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SupplierDto, ProductDto, getCurrencySymbol } from '@smartfeed/shared';
import { getProducts } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';

interface SupplierProductsTabProps {
  supplier: SupplierDto;
}

export const SupplierProductsTab: React.FC<SupplierProductsTabProps> = ({ supplier }) => {
  const { t } = useTranslation(['suppliers', 'common']);
  const { token } = useAuth();

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getProducts({ supplierId: supplier.id }, token || undefined);
      setProducts(data?.items || []);
    } catch (err) {
      console.warn('[SupplierProductsTab:loadProducts] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supplier.id, token]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.titleUk?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.categoryNameUk?.toLowerCase().includes(q),
    );
  }, [products, search]);

  const currencySym = getCurrencySymbol(supplier.baseCurrency || 'UAH');

  return (
    <div className="space-y-4" data-testid="supplier-products-tab">
      {/* Search toolbar */}
      <div className="flex items-center justify-between gap-3 bg-muted/40 p-2.5 rounded-xl border border-border/70">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('suppliers:searchProduct', {
              defaultValue: 'Пошук за артикулом або назвою...',
            })}
            className="pl-8 h-8 text-xs bg-background/80"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {t('suppliers:totalProductsFound', { defaultValue: 'Знайдено товарів' })}:{' '}
          <span className="font-semibold text-foreground font-mono">{filtered.length}</span>
        </div>
      </div>

      {isLoading ? (
        <Card className="border border-border/80 bg-card/40 p-8 text-center">
          <p className="text-xs text-muted-foreground animate-pulse">
            {t('common:loading', { defaultValue: 'Завантаження...' })}
          </p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-border/80 bg-card/40 p-8 text-center">
          <div className="flex flex-col items-center justify-center gap-2.5">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Package className="size-5" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">
              {t('suppliers:noProductsTitle', { defaultValue: 'Товарів не знайдено' })}
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm">
              {t('suppliers:noProductsDesc', {
                defaultValue: 'Товари з’являться тут після імпорту фідів або додавання вручну',
              })}
            </p>
          </div>
        </Card>
      ) : (
        <div className="border border-border/80 rounded-xl bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto max-h-[500px]">
            <Table className="text-xs">
              {/* 100% Solid Sticky Header */}
              <TableHeader className="sticky top-0 bg-card z-10 border-b border-border/80">
                <TableRow className="h-9 hover:bg-transparent">
                  <TableHead className="w-[80px] pl-3.5 font-semibold text-foreground">
                    Артикул
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">Назва товару</TableHead>
                  <TableHead className="w-[140px] font-semibold text-foreground">
                    Категорія
                  </TableHead>
                  <TableHead className="w-[110px] font-semibold text-foreground text-center">
                    Собівартість
                  </TableHead>
                  <TableHead className="w-[110px] font-semibold text-foreground text-center">
                    Ціна продажу
                  </TableHead>
                  <TableHead className="w-[100px] pr-3.5 text-center font-semibold text-foreground">
                    Наявність
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 50).map((prod) => (
                  <TableRow
                    key={prod.id}
                    className="h-11 border-b border-border/60 hover:bg-muted/40"
                  >
                    <TableCell className="pl-3.5 py-1.5 font-mono text-xs font-medium text-muted-foreground">
                      {prod.sku}
                    </TableCell>
                    <TableCell className="py-1.5 font-medium text-foreground truncate max-w-[260px]">
                      {prod.titleUk || 'Без назви'}
                    </TableCell>
                    <TableCell className="py-1.5 text-muted-foreground truncate max-w-[140px]">
                      {prod.categoryNameUk || '—'}
                    </TableCell>
                    <TableCell className="py-1.5 text-center font-mono">
                      {prod.costPrice ? `${prod.costPrice} ${currencySym}` : '—'}
                    </TableCell>
                    <TableCell className="py-1.5 text-center font-mono font-bold text-primary">
                      {prod.price ? `${prod.price} ₴` : '—'}
                    </TableCell>
                    <TableCell className="pr-3.5 py-1.5 text-center">
                      {prod.inStock ? (
                        <Badge
                          variant="outline"
                          className="border-success/30 bg-success/15 text-success text-2xs font-medium"
                        >
                          В наявності
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-2xs font-medium">
                          Немає
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};
