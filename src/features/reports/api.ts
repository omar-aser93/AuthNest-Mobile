import { infiniteQueryOptions, useMutation, useQueryClient,} from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { MyReportsPage, ReportReason, ReportTargetType } from './types';

// ─── Query keys ──────────────────────────────────────────────────────────────
export const reportKeys = {
  all: ['reports'] as const,
  my: () => [...reportKeys.all, 'my'] as const,
};


// ─── Create report ───────────────────────────────────────────────────────────
type CreateReportPayload = {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
};

async function createReportRequest(p: CreateReportPayload): Promise<void> {
  await api.post('/reports', {
    ...p,
    description: p.description?.trim() || undefined,
  });
}

export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createReportRequest,
    onSuccess: () => {
      // My-reports list gains a row (PENDING)
      qc.invalidateQueries({ queryKey: reportKeys.my() });
    },
  });
}


// ─── My reports (offset paginated → exposed as infinite) ────────────────────
async function fetchMyReports(page: number): Promise<MyReportsPage> {
  const res = await api.get<MyReportsPage>('/reports/me', {
    params: { page, limit: 20 },
  });
  return res.data;
}

export const myReportsInfiniteQueryOptions = () =>
  infiniteQueryOptions({
    queryKey: reportKeys.my(),
    queryFn: ({ pageParam }) => fetchMyReports(pageParam),
    initialPageParam: 1 as number,
    getNextPageParam: (last) =>
      last.page < last.totalPages ? last.page + 1 : undefined,
    staleTime: 30_000,
  });