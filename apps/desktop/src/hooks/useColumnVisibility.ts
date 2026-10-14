import { useState, useCallback, useMemo, useEffect } from 'react';

export interface ColumnConfig<T extends string = string> {
  id: T;
  labelUk: string;
  labelEn: string;
  defaultVisible?: boolean;
  canHide?: boolean;
}

export interface ColumnOption<T extends string = string> {
  id: T;
  label: string;
  isVisible: boolean;
  canHide: boolean;
}

export function useColumnVisibility<T extends string>(
  storageKey: string,
  columns: ColumnConfig<T>[],
  isUk = true,
) {
  const initialVisibility = useMemo(() => {
    const defaultState: Record<string, boolean> = {};
    columns.forEach((col) => {
      defaultState[col.id] = col.defaultVisible !== false;
    });

    if (typeof window === 'undefined') {
      return defaultState as Record<T, boolean>;
    }

    try {
      const stored = localStorage.getItem(`table_columns_${storageKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed === 'object' && parsed !== null) {
          return { ...defaultState, ...parsed } as Record<T, boolean>;
        }
      }
    } catch (err) {
      console.warn(`[useColumnVisibility] Failed to parse column storage for ${storageKey}:`, err);
    }

    return defaultState as Record<T, boolean>;
  }, [storageKey, columns]);

  const [visibleColumns, setVisibleColumns] = useState<Record<T, boolean>>(initialVisibility);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`table_columns_${storageKey}`, JSON.stringify(visibleColumns));
    } catch (err) {
      console.warn(`[useColumnVisibility] Failed to persist columns for ${storageKey}:`, err);
    }
  }, [storageKey, visibleColumns]);

  const toggleColumn = useCallback((columnId: T, isVisible?: boolean) => {
    setVisibleColumns((prev) => {
      const nextVal = typeof isVisible === 'boolean' ? isVisible : !prev[columnId];
      return { ...prev, [columnId]: nextVal };
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    const defaultState: Record<string, boolean> = {};
    columns.forEach((col) => {
      defaultState[col.id] = col.defaultVisible !== false;
    });
    setVisibleColumns(defaultState as Record<T, boolean>);
  }, [columns]);

  const isColumnVisible = useCallback(
    (id: T) => {
      return visibleColumns[id] !== false;
    },
    [visibleColumns],
  );

  const columnOptions: ColumnOption<T>[] = useMemo(() => {
    return columns.map((col) => ({
      id: col.id,
      label: isUk ? col.labelUk : col.labelEn,
      isVisible: visibleColumns[col.id] !== false,
      canHide: col.canHide !== false,
    }));
  }, [columns, isUk, visibleColumns]);

  return {
    visibleColumns,
    isColumnVisible,
    toggleColumn,
    resetToDefaults,
    columnOptions,
  };
}
