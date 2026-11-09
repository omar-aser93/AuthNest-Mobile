import { useState } from 'react';
import { Modal, Pressable, View, TextInput, ScrollView } from 'react-native';
import { Check, X } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ApiError } from '@/lib/api';
import { useCreateReport } from '../api';
import type { ReportReason, ReportTargetType } from '../types';

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'SPAM',           label: 'Spam' },
  { value: 'HARASSMENT',     label: 'Harassment or bullying' },
  { value: 'HATE_SPEECH',    label: 'Hate speech' },
  { value: 'VIOLENCE',       label: 'Violence or dangerous content' },
  { value: 'NUDITY',         label: 'Nudity or sexual content' },
  { value: 'FALSE_INFO',     label: 'False information' },
  { value: 'COPYRIGHT',      label: 'Copyright violation' },
  { value: 'IMPERSONATION',  label: 'Impersonation' },
  { value: 'OTHER',          label: 'Other' },
];

const TARGET_LABEL: Record<ReportTargetType, string> = {
  POST: 'post',
  COMMENT: 'comment',
  USER: 'user',
};

type Props = {
  visible: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
};

export function ReportModal({ visible, onClose, targetType, targetId }: Props) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const createReport = useCreateReport();

  const reset = () => {
    setReason(null);
    setDescription('');
    setError(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = () => {
    if (!reason) {
      setError('Please select a reason');
      return;
    }
    setError(null);
    createReport.mutate(
      { targetType, targetId, reason, description },
      { onSuccess: () => close(),
        onError: (err) => setError(err instanceof ApiError ? err.message : 'Failed to submit report') },
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable className="flex-1 justify-center bg-black/50 px-6" onPress={close}>
        <Pressable className="bg-background rounded-2xl max-h-[90%]" onPress={() => {}}>
          {/* Header */}
          <View className="flex-row items-start justify-between px-5 pt-5 pb-3 border-b border-border">
            <View className="flex-1 pr-3">
              <Text className="text-lg font-semibold text-foreground">
                Report this {TARGET_LABEL[targetType]}
              </Text>
              <Text className="text-xs text-muted-foreground mt-0.5">
                Reports are anonymous to the person you're reporting.
              </Text>
            </View>
            <Pressable onPress={close} hitSlop={8} className="p-1 rounded-md active:bg-secondary">
              <X size={18} className="text-muted-foreground" />
            </Pressable>
          </View>

          {/* Scrollable body */}
          <ScrollView className="px-5 py-3" keyboardShouldPersistTaps="handled">
            <Text className="text-sm font-medium text-foreground mb-2">Reason</Text>
            <View className="rounded-lg border border-border overflow-hidden">
              {REASONS.map((r, idx) => {
                const selected = reason === r.value;
                return (
                  <Pressable key={r.value} onPress={() => { setReason(r.value);  if (error) setError(null); }}
                    className={`flex-row items-center justify-between px-3 py-3 active:bg-secondary ${ idx > 0 ? 'border-t border-border' : '' }`}
                  >
                    <Text className={`text-sm ${selected ? 'text-foreground font-medium' : 'text-foreground'}`}>
                      {r.label}
                    </Text>
                    {selected && <Check size={16} className="text-primary" />}
                  </Pressable>
                );
              })}
            </View>

            <Text className="text-sm font-medium text-foreground mt-4 mb-2">
              Additional details{' '}
              <Text className="text-muted-foreground font-normal">(optional)</Text>
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={500}
              placeholder="Anything else that will help us review…"
              placeholderTextColor="#9ca3af"
              style={{ textAlignVertical: 'top' }}
              className="min-h-20 rounded-lg border border-border bg-background px-3 py-2 text-base text-foreground"
            />
            <Text className="text-xs text-muted-foreground text-right mt-1">
              {description.length}/500
            </Text>

            {error && <Text className="text-sm text-destructive mt-2">{error}</Text>}
          </ScrollView>

          {/* Footer */}
          <View className="px-5 pb-5 pt-2 border-t border-border">
            <Button onPress={submit} disabled={!reason || createReport.isPending} className="w-full" >
              <Text>
                {createReport.isPending ? 'Submitting…' : 'Submit report'}
              </Text>
            </Button>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}