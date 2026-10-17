import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { FeedCollisionResultDto, FeedCollisionType } from '@smartfeed/shared';
import { useTranslation } from '@/i18n';

interface FeedCollisionNoticeProps {
  collisionResult: FeedCollisionResultDto | null;
  isChecking?: boolean;
}

export const FeedCollisionNotice: React.FC<FeedCollisionNoticeProps> = ({
  collisionResult,
  isChecking,
}) => {
  const { t } = useTranslation(['suppliers']);

  if (isChecking) {
    return (
      <div className="p-2 rounded-xl bg-muted/40 border border-border/50 text-2xs text-muted-foreground animate-pulse">
        {t('suppliers:checkingCollisions', { defaultValue: 'Перевірка унікальності фіду...' })}
      </div>
    );
  }

  if (!collisionResult) return null;

  if (!collisionResult.hasCollision) {
    return (
      <div
        data-testid="feed-unique-badge"
        className="p-2.5 rounded-xl bg-primary/10 border border-primary/25 text-primary text-xs flex items-center gap-2 animate-in fade-in duration-200"
      >
        <CheckCircle2 className="size-4 shrink-0 text-primary" />
        <span className="font-medium text-2xs">
          {t('suppliers:feedNameUniqueValidated', {
            defaultValue: 'Фід унікальний. Колізій не виявлено',
          })}
        </span>
      </div>
    );
  }

  if (collisionResult.collisionType === FeedCollisionType.SAME_SUPPLIER_DUPLICATE) {
    return (
      <div
        data-testid="feed-duplicate-warning"
        className="p-3.5 rounded-xl bg-destructive/15 border-2 border-destructive/40 text-xs flex flex-col gap-1.5 animate-in fade-in duration-200 shadow-sm"
      >
        <div className="flex items-center gap-2 font-bold text-destructive text-xs">
          <AlertTriangle className="size-4 shrink-0 text-destructive" />
          <span>
            {t('suppliers:feedSameSupplierDuplicateTitle', {
              defaultValue: 'Фід уже підключений до постачальника',
            })}
          </span>
        </div>
        <p className="text-destructive/90 text-2xs leading-relaxed font-medium">
          {t('suppliers:feedSameSupplierDuplicateMsg', {
            name: collisionResult.existingFeedName || 'Існуючий фід',
            count: collisionResult.existingProductsCount || 0,
            defaultValue: `Цей фід уже підключений під назвою «${collisionResult.existingFeedName}» (${collisionResult.existingProductsCount} товарів). Створення дубліката заблоковано.`,
          })}
        </p>
      </div>
    );
  }

  if (collisionResult.collisionType === FeedCollisionType.CROSS_SUPPLIER_CONFLICT) {
    return (
      <div
        data-testid="feed-collision-warning"
        className="p-3.5 rounded-xl bg-muted/60 border border-border text-xs flex flex-col gap-1.5 animate-in fade-in duration-200 shadow-sm"
      >
        <div className="flex items-center gap-2 font-bold text-foreground text-xs">
          <AlertTriangle className="size-4 shrink-0 text-primary" />
          <span>
            {t('suppliers:feedCrossSupplierConflictTitle', {
              defaultValue: 'Фід використовується іншим постачальником',
            })}
          </span>
        </div>
        <p className="text-muted-foreground text-2xs leading-relaxed font-medium">
          {t('suppliers:feedCrossSupplierConflictMsg', {
            supplier: collisionResult.conflictingSupplierName || 'Інший постачальник',
            defaultValue: `Цей фід уже зареєстрований за постачальником «${collisionResult.conflictingSupplierName}». Вкажіть власну назву фіду в полі нижче для розділення потоків.`,
          })}
        </p>
      </div>
    );
  }

  return null;
};
