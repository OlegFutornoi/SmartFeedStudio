import type {
  LegalDocumentDto,
  CreateLegalDocumentDto,
  UpdateLegalDocumentDto,
} from '@smartfeed/shared';
import { baseClient } from '@/lib/api/client';

export async function getPublishedLegalDocuments(): Promise<LegalDocumentDto[]> {
  return baseClient.request<LegalDocumentDto[]>('/legal');
}

export async function getLegalDocumentBySlug(slug: string): Promise<LegalDocumentDto> {
  return baseClient.request<LegalDocumentDto>(`/legal/document/${slug}`);
}

export async function getAdminLegalDocuments(): Promise<LegalDocumentDto[]> {
  return baseClient.request<LegalDocumentDto[]>('/legal/admin/all');
}

export async function createLegalDocument(dto: CreateLegalDocumentDto): Promise<LegalDocumentDto> {
  return baseClient.request<LegalDocumentDto>('/legal/admin', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateLegalDocument(
  id: string,
  dto: UpdateLegalDocumentDto,
): Promise<LegalDocumentDto> {
  return baseClient.request<LegalDocumentDto>(`/legal/admin/${id}`, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

export async function deleteLegalDocument(id: string): Promise<{ success: boolean }> {
  return baseClient.request<{ success: boolean }>(`/legal/admin/${id}`, {
    method: 'DELETE',
  });
}
