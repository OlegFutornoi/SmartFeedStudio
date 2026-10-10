'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  LegalDocumentDto,
  CreateLegalDocumentDto,
  UpdateLegalDocumentDto,
} from '@smartfeed/shared';
import { FileText, Loader2 } from 'lucide-react';

interface EditLegalDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: LegalDocumentDto | null;
  onSave: (doc: CreateLegalDocumentDto | UpdateLegalDocumentDto) => Promise<void>;
  isSaving: boolean;
}

export function EditLegalDocumentModal({
  isOpen,
  onClose,
  document,
  onSave,
  isSaving,
}: EditLegalDocumentModalProps) {
  const { locale } = useLanguage();
  const isUk = locale === 'uk';

  const [activeTab, setActiveTab] = useState<'uk' | 'en'>('uk');
  const [slug, setSlug] = useState('');
  const [titleUk, setTitleUk] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [contentUk, setContentUk] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [version, setVersion] = useState('2.0');

  useEffect(() => {
    if (document) {
      setSlug(document.slug);
      setTitleUk(document.titleUk);
      setTitleEn(document.titleEn);
      setContentUk(document.contentUk);
      setContentEn(document.contentEn);
      setIsPublished(document.isPublished);
      setVersion(document.version || '2.0');
    } else {
      setSlug('');
      setTitleUk('');
      setTitleEn('');
      setContentUk('');
      setContentEn('');
      setIsPublished(true);
      setVersion('2.0');
    }
  }, [document, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      slug,
      titleUk,
      titleEn,
      contentUk,
      contentEn,
      isPublished,
      version,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="pb-3 border-b border-border/80">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <DialogTitle>
              {document
                ? isUk
                  ? 'Редагувати юридичний документ'
                  : 'Edit Legal Document'
                : isUk
                  ? 'Створити юридичний документ'
                  : 'Create Legal Document'}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isUk
              ? 'Налаштуйте зміст та параметри відображення юридичного документа для клієнтів'
              : 'Configure legal document content and display settings for client apps'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Metadata Row: Slug & Version */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="doc-slug" className="text-xs">
                Slug (URL identifier)
              </Label>
              <Input
                id="doc-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="terms-of-service"
                required
                disabled={isSaving || !!document}
                className="h-8.5 text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-version" className="text-xs">
                {isUk ? 'Версія' : 'Version'}
              </Label>
              <Input
                id="doc-version"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="2.0"
                disabled={isSaving}
                className="h-8.5 text-xs"
              />
            </div>
          </div>

          {/* Titles Row: UA & EN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="title-uk" className="text-xs">
                {isUk ? 'Заголовок (UA)' : 'Title (UA)'}
              </Label>
              <Input
                id="title-uk"
                value={titleUk}
                onChange={(e) => setTitleUk(e.target.value)}
                placeholder="Умови використання..."
                required
                disabled={isSaving}
                className="h-8.5 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="title-en" className="text-xs">
                {isUk ? 'Заголовок (EN)' : 'Title (EN)'}
              </Label>
              <Input
                id="title-en"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="Terms of Service..."
                required
                disabled={isSaving}
                className="h-8.5 text-xs"
              />
            </div>
          </div>

          {/* Language Tabs for Content */}
          <div className="flex border-b border-border/80 pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('uk')}
              className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'uk'
                  ? 'border-primary text-foreground font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              🇺🇦 Українська версія
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('en')}
              className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'en'
                  ? 'border-primary text-foreground font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              🇬🇧 English Version
            </button>
          </div>

          {/* Content Textarea */}
          <div className="space-y-1.5">
            <Label className="text-xs">
              {isUk
                ? activeTab === 'uk'
                  ? 'Текст українською (Markdown)'
                  : 'Текст англійською (Markdown)'
                : activeTab === 'uk'
                  ? 'Content in Ukrainian (Markdown)'
                  : 'Content in English (Markdown)'}
            </Label>
            {activeTab === 'uk' ? (
              <textarea
                value={contentUk}
                onChange={(e) => setContentUk(e.target.value)}
                placeholder="Введіть текст документа українською мовою..."
                required
                disabled={isSaving}
                rows={11}
                className="w-full rounded-md border border-input bg-background p-3 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring font-mono resize-y min-h-[220px]"
              />
            ) : (
              <textarea
                value={contentEn}
                onChange={(e) => setContentEn(e.target.value)}
                placeholder="Enter document text in English..."
                required
                disabled={isSaving}
                rows={11}
                className="w-full rounded-md border border-input bg-background p-3 text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring font-mono resize-y min-h-[220px]"
              />
            )}
          </div>

          {/* Published Toggle */}
          <div className="flex items-center justify-between border-t border-border/60 pt-4 pb-1">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-foreground">
                {isUk ? 'Опубліковано для клієнтів' : 'Published for clients'}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {isUk
                  ? 'Документ буде доступний у десктоп-додатку'
                  : 'Document will be accessible in desktop app'}
              </span>
            </div>
            <Switch checked={isPublished} onCheckedChange={setIsPublished} disabled={isSaving} />
          </div>

          {/* Dialog Action Buttons */}
          <DialogFooter className="border-t border-border/60 pt-3 mt-3 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
              className="text-xs"
            >
              {isUk ? 'Скасувати' : 'Cancel'}
            </Button>
            <Button type="submit" size="sm" disabled={isSaving} className="text-xs">
              {isSaving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {isUk ? 'Зберегти документ' : 'Save Document'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
