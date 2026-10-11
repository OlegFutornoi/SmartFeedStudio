'use client';

import React, { useState } from 'react';
import { LegalDocumentDto } from '@smartfeed/shared';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { Edit2, Plus, Search, FileText, CheckCircle2, Clock } from 'lucide-react';
import { useColumnVisibility, ColumnConfig } from '@/hooks/useColumnVisibility';
import { DataTableViewOptions } from '@/components/ui/DataTableViewOptions';

interface LegalDocumentsTableProps {
  documents: LegalDocumentDto[];
  onEdit: (doc: LegalDocumentDto) => void;
  onCreate: () => void;
  isLoading: boolean;
}

type LegalDocColumnId = 'title' | 'slug' | 'version' | 'status' | 'updated' | 'actions';

const LEGAL_DOC_COLUMNS: ColumnConfig<LegalDocColumnId>[] = [
  {
    id: 'title',
    labelUk: 'Назва документа',
    labelEn: 'Document Title',
    canHide: false,
    defaultVisible: true,
  },
  { id: 'slug', labelUk: 'Slug', labelEn: 'Slug', canHide: true, defaultVisible: true },
  { id: 'version', labelUk: 'Версія', labelEn: 'Version', canHide: true, defaultVisible: true },
  { id: 'status', labelUk: 'Статус', labelEn: 'Status', canHide: true, defaultVisible: true },
  { id: 'updated', labelUk: 'Оновлено', labelEn: 'Updated', canHide: true, defaultVisible: true },
  { id: 'actions', labelUk: 'Дії', labelEn: 'Actions', canHide: false, defaultVisible: true },
];

export function LegalDocumentsTable({
  documents,
  onEdit,
  onCreate,
  isLoading,
}: LegalDocumentsTableProps) {
  const { locale } = useLanguage();
  const isUk = locale === 'uk';
  const [search, setSearch] = useState('');

  const { visibleColumns, toggleColumn, resetToDefaults, columnOptions } =
    useColumnVisibility<LegalDocColumnId>('admin_legal_doc_columns', LEGAL_DOC_COLUMNS, isUk);

  const filteredDocs = documents.filter((doc) => {
    const q = search.toLowerCase();
    return (
      doc.titleUk.toLowerCase().includes(q) ||
      doc.titleEn.toLowerCase().includes(q) ||
      doc.slug.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isUk ? 'Пошук документів...' : 'Search documents...'}
            className="pl-8 h-8 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <DataTableViewOptions<LegalDocColumnId>
            columnOptions={columnOptions}
            onToggleColumn={toggleColumn}
            onResetDefaults={resetToDefaults}
            isUk={isUk}
          />
          <Button onClick={onCreate} size="sm" className="h-8 text-xs gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            <span>{isUk ? 'Додати документ' : 'Add Document'}</span>
          </Button>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-xs">
                {isUk ? 'Назва документа' : 'Document Title'}
              </TableHead>
              {visibleColumns.slug !== false && <TableHead className="text-xs">Slug</TableHead>}
              {visibleColumns.version !== false && (
                <TableHead className="text-xs">{isUk ? 'Версія' : 'Version'}</TableHead>
              )}
              {visibleColumns.status !== false && (
                <TableHead className="text-xs">{isUk ? 'Статус' : 'Status'}</TableHead>
              )}
              {visibleColumns.updated !== false && (
                <TableHead className="text-xs">{isUk ? 'Оновлено' : 'Updated'}</TableHead>
              )}
              <TableHead className="text-xs text-right">{isUk ? 'Дії' : 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={Object.values(visibleColumns).filter(Boolean).length + 2}
                  className="h-28 text-center text-xs text-muted-foreground"
                >
                  {isUk ? 'Завантаження юридичних документів...' : 'Loading legal documents...'}
                </TableCell>
              </TableRow>
            ) : filteredDocs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={Object.values(visibleColumns).filter(Boolean).length + 2}
                  className="h-28 text-center text-xs text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-1">
                    <FileText className="h-6 w-6 text-muted-foreground/60" />
                    <span>{isUk ? 'Документів не знайдено' : 'No documents found'}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredDocs.map((doc) => (
                <TableRow key={doc.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground text-xs">
                        {isUk ? doc.titleUk : doc.titleEn}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {isUk ? doc.titleEn : doc.titleUk}
                      </span>
                    </div>
                  </TableCell>
                  {visibleColumns.slug !== false && (
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono text-muted-foreground">
                        {doc.slug}
                      </code>
                    </TableCell>
                  )}
                  {visibleColumns.version !== false && (
                    <TableCell className="text-xs text-muted-foreground">
                      v{doc.version || '2.0'}
                    </TableCell>
                  )}
                  {visibleColumns.status !== false && (
                    <TableCell>
                      {doc.isPublished ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-5 px-1.5 py-0 gap-1 border-primary/20 text-primary bg-primary/10"
                        >
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          <span>{isUk ? 'Опубліковано' : 'Published'}</span>
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-5 px-1.5 py-0 gap-1 text-muted-foreground bg-muted/40"
                        >
                          <Clock className="h-2.5 w-2.5" />
                          <span>{isUk ? 'Чернетка' : 'Draft'}</span>
                        </Badge>
                      )}
                    </TableCell>
                  )}
                  {visibleColumns.updated !== false && (
                    <TableCell className="text-xs text-muted-foreground">
                      {doc.updatedAt
                        ? new Date(doc.updatedAt).toLocaleDateString(isUk ? 'uk-UA' : 'en-US')
                        : '—'}
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(doc)}
                      className="h-7 px-2 text-xs gap-1 hover:text-foreground"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>{isUk ? 'Редагувати' : 'Edit'}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
