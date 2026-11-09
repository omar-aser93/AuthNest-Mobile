import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { formatTimeAgo } from '@/lib/utils';
import type { MyReport, ReportStatus } from '../types';

const TARGET_LABEL: Record<MyReport['targetType'], string> = {
  POST: 'Post',
  COMMENT: 'Comment',
  USER: 'User',
};

// Mirrors web's Badge variants:
//   PENDING   → secondary  (grey)
//   REVIEWED  → secondary
//   ACTIONED  → default    (primary)
//   DISMISSED → outline    (muted border)
const STATUS_CLS: Record<ReportStatus, string> = {
  PENDING:   'bg-secondary',
  REVIEWED:  'bg-secondary',
  ACTIONED:  'bg-primary/10',
  DISMISSED: 'border border-border',
};

const STATUS_TEXT_CLS: Record<ReportStatus, string> = {
  PENDING:   'text-muted-foreground',
  REVIEWED:  'text-muted-foreground',
  ACTIONED:  'text-primary',
  DISMISSED: 'text-muted-foreground',
};

export function ReportRow({ report }: { report: MyReport }) {
  const reasonLabel = report.reason.replace(/_/g, ' ').toLowerCase();

  return (
    <View className="flex-row items-center justify-between px-4 py-3 border-b border-border/50">
      <View className="flex-1 gap-1">
        <Text className="text-sm font-medium text-foreground">
          {TARGET_LABEL[report.targetType]} ·{' '}
          <Text className="font-normal capitalize">{reasonLabel}</Text>
        </Text>
        <Text className="text-xs text-muted-foreground">
          Reported {formatTimeAgo(report.createdAt)}
        </Text>
      </View>
      <View className={`rounded-full px-2.5 py-0.5 ${STATUS_CLS[report.status]}`}>
        <Text className={`text-[10px] font-medium capitalize ${STATUS_TEXT_CLS[report.status]}`}>
          {report.status.toLowerCase()}
        </Text>
      </View>
    </View>
  );
}