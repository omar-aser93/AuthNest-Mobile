import { useEffect, useState } from 'react';
import { View, Alert } from 'react-native';
import { MessageSquareWarning } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ApiError } from '@/lib/api';
import { useResendVerification } from '../api';

type VerificationWarningBarProps = {
  emailVerifyExpiry: string;
};

// A component to display a warning bar if the user's email is not verified
export function VerificationWarningBar({ emailVerifyExpiry }: VerificationWarningBarProps) {
  const resend = useResendVerification();
  const [isExpired, setIsExpired] = useState<boolean | null>(null);

  // Compute expiry after mount so the first render matches the initial (false) state 
  // — the web version uses the same pattern to avoid hydration mismatches. On mobile it avoids a layout jump.
  useEffect(() => {
    const expiry = new Date(emailVerifyExpiry).getTime();
    setIsExpired(Date.now() > expiry);
  }, [emailVerifyExpiry]);

  const handleResend = () => {
    resend.mutate(undefined, {
      onSuccess: () => Alert.alert('Sent', 'Check your inbox for the verification email.'),
      onError: (err) => Alert.alert('Error', err instanceof ApiError ? err.message : 'Failed to resend'),
    });
  };

  if (isExpired === null) return null;

  return (
    <View className="mx-4 mb-4 flex-row items-center gap-3 rounded-xl border border-yellow-300 bg-yellow-100 p-4 dark:border-yellow-800 dark:bg-yellow-900/30">
      <MessageSquareWarning size={20} className="text-yellow-700 dark:text-yellow-300" />
      <Text className="flex-1 text-sm text-yellow-800 dark:text-yellow-200">
        Verify your email to activate all features.
      </Text>

      {isExpired ? (
        <Button variant="outline" onPress={handleResend} disabled={resend.isPending} className="border-yellow-700 dark:border-yellow-300">
          <Text className="text-yellow-800 dark:text-yellow-200">
            {resend.isPending ? 'Sending…' : 'Resend'}
          </Text>
        </Button>
      ) : (
        <Text className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
          Check your email
        </Text>
      )}
    </View>
  );
}