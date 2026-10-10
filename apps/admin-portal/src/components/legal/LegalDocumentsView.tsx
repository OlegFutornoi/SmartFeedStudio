'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  LegalDocumentDto,
  CreateLegalDocumentDto,
  UpdateLegalDocumentDto,
} from '@smartfeed/shared';
import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { LegalDocumentsTable } from '@/components/legal/LegalDocumentsTable';
import { EditLegalDocumentModal } from '@/components/legal/EditLegalDocumentModal';
import { FileText, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

interface LegalDocumentsViewProps {
  showBackToSettings?: boolean;
}

export function LegalDocumentsView({ showBackToSettings = false }: LegalDocumentsViewProps) {
  const { locale } = useLanguage();
  const isUk = locale === 'uk';

  const [documents, setDocuments] = useState<LegalDocumentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<LegalDocumentDto | null>(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getAdminLegalDocuments();
      setDocuments(data);
    } catch {
      setError(
        isUk ? 'Помилка завантаження юридичних документів' : 'Failed to load legal documents',
      );
    } finally {
      setIsLoading(false);
    }
  }, [isUk]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleEdit = (doc: LegalDocumentDto) => {
    setEditingDoc(doc);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingDoc(null);
    setIsModalOpen(true);
  };

  const handleSave = async (data: CreateLegalDocumentDto | UpdateLegalDocumentDto) => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (editingDoc) {
        await api.updateLegalDocument(editingDoc.id, data as UpdateLegalDocumentDto);
        setSuccess(isUk ? 'Документ успішно оновлено' : 'Legal document updated successfully');
      } else {
        await api.createLegalDocument(data as CreateLegalDocumentDto);
        setSuccess(isUk ? 'Документ успішно створено' : 'Legal document created successfully');
      }
      setIsModalOpen(false);
      await fetchDocuments();
    } catch {
      setError(isUk ? 'Не вдалося зберегти юридичний документ' : 'Failed to save legal document');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      data-testid="legal-documents-page"
      className="flex flex-col gap-6 max-w-5xl animate-in fade-in duration-300"
    >
      {/* Top Back Navigation Toolbar (if accessed via Settings) */}
      {showBackToSettings && (
        <div className="flex items-center justify-between pb-1">
          <Link
            href="/settings"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>{isUk ? 'До налаштувань' : 'Back to Settings'}</span>
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-border/60 pb-4">
        <div className="flex items-center gap-2.5">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {isUk ? 'Юридичні документи' : 'Legal Documents'}
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {isUk
            ? 'Керування публічними угодами, правилами використання та політикою конфіденційності'
            : 'Manage public terms of service, privacy policies, and platform legal agreements'}
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs font-medium animate-in fade-in">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-medium animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" />
          <span>{success}</span>
        </div>
      )}

      {/* Table */}
      <LegalDocumentsTable
        documents={documents}
        onEdit={handleEdit}
        onCreate={handleCreate}
        isLoading={isLoading}
      />

      {/* Modal */}
      <EditLegalDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        document={editingDoc}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
}
