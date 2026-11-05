import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { invalidate } from '@/api/invalidate';
import type { Paginated } from '@/api/types';

export type AccessStatus = 'active' | 'completed' | 'revoked';
export interface AccessRow {
  id: string; status: AccessStatus; maxAttempts: number; expiresAt: string | null; createdAt: string;
  student: { id: string; name: string; email: string }; exam: { id: string; title: string }; attemptsUsed: number; bestPercentage: number | null;
}
export interface AccessParams { page: number; limit: number; examId?: string; status?: AccessStatus; ids?: string }
export interface CreateResult { created: AccessRow[]; skipped: { studentId: string; reason: string }[] }

export const useExamAccess = (params: AccessParams) =>
  useQuery({ queryKey: ['exam-access', params], placeholderData: keepPreviousData, queryFn: async () => (await api.get<Paginated<AccessRow>>('/exam-access', { params })).data });
export const useQrLink = (id: string, enabled: boolean) => useQuery({ queryKey: ['qr-link', id], enabled, staleTime: 0, queryFn: async () => (await api.get<{ url: string }>(`/qr/${id}/link`)).data.url });

function useAccessMutation<V, R>(fn: (v: V) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => invalidate(qc, 'access') });
}
export const useShareExam = () => useAccessMutation(async (b: { examId: string; studentIds: string[]; expiresAt?: string; maxAttempts?: number }) => (await api.post<CreateResult>('/exam-access', b)).data);
export const useRevoke = () => useAccessMutation(async (id: string) => (await api.post(`/exam-access/${id}/revoke`)).data);
export const useRegenerateQr = () => useAccessMutation(async (id: string) => (await api.post(`/exam-access/${id}/qr/regenerate`)).data);

/** Same-origin image URL (the session cookie authorises it). */
export const qrUrl = (id: string, format: 'png' | 'svg', download = false, bust = '') => `/api/qr/${id}?format=${format}${download ? '&download=1' : ''}${bust ? `&v=${bust}` : ''}`;
