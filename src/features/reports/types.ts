export type ReportTargetType = 'POST' | 'COMMENT' | 'USER';

export type ReportReason =
  | 'SPAM' | 'HARASSMENT' | 'HATE_SPEECH' | 'VIOLENCE' | 'NUDITY'
  | 'FALSE_INFO' | 'COPYRIGHT' | 'IMPERSONATION' | 'OTHER';

export type ReportStatus = 'PENDING' | 'REVIEWED' | 'ACTIONED' | 'DISMISSED';

// Matches backend GET /reports/me → { reports: [...] }
export type MyReport = {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  status: ReportStatus;
  createdAt: string;
  reviewedAt: string | null;
};

export type MyReportsPage = {
  reports: MyReport[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};