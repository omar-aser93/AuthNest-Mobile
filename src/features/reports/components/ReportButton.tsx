import { useState } from 'react';
import { Flag } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { ReportModal } from './ReportModal';

type Props = {
  targetUserId: string;
};

export function ReportButton({ targetUserId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" variant="outline" onPress={() => setOpen(true)}>
        <Flag size={14} className="text-muted-foreground" />        
      </Button>
      <ReportModal
        visible={open}
        onClose={() => setOpen(false)}
        targetType="USER"
        targetId={targetUserId}
      />
    </>
  );
}