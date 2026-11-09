import { useEffect, useState } from 'react';
import { View, Pressable, } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { FormField } from '@/components/ui/FormField';
import { OTPInput } from '@/components/ui/OTPInput';
import { ApiError, api } from '@/lib/api';
import { otpSchema, type OtpType } from '../schemas';

export function VerifyOTPScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);

  const form = useForm<OtpType>({
    resolver: zodResolver(otpSchema),
    defaultValues: { email: email ?? '', otp: '' },
  });

  useEffect(() => {
    if (timer === 0) return;
    const id = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const res = await api.post<{ resetToken: string }>('/auth/verify-otp', values);
      router.push({
        pathname: '/reset-password',
        params: { email: values.email, token: res.data.resetToken },
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Verification failed';
      form.setError('root', { message });
    } finally {
      setSubmitting(false);
    }
  });

  const onResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setTimer(60);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to resend code';
      form.setError('root', { message });
    } finally {
      setResending(false);
    }
  };

  return (
    <Screen>
      <View className="mb-8 mt-6 items-center">
        <Text className="text-3xl font-bold text-foreground">Verify code</Text>
        <Text className="mt-2 text-center text-base text-muted-foreground">
          Enter the 6-digit code sent to {email}
        </Text>
      </View>

      <View className="gap-4">
        <Controller
          control={form.control}
          name="otp"
          render={({ field, fieldState }) => (
            <FormField label="" htmlFor="otp-input" error={fieldState.error?.message}>
              <OTPInput
                value={field.value}
                onChange={field.onChange}
                invalid={fieldState.invalid}
              />
            </FormField>
          )}
        />

        {form.formState.errors.root && (
          <Text className="text-center text-sm text-destructive">
            {form.formState.errors.root.message}
          </Text>
        )}

        <Button onPress={onSubmit} disabled={submitting} className="mt-2">          
          <Text>{submitting ? 'Verifying…' : 'Verify'}</Text>
        </Button>

        <View className="mt-4 items-center">
          {timer > 0 ? (
            <Text className="text-sm text-muted-foreground">
              Resend available in{' '}
              <Text className="font-semibold text-foreground">{timer}s</Text>
            </Text>
          ) : (
            <Pressable onPress={onResend} disabled={resending}>
              <Text className="font-semibold text-primary">
                {resending ? 'Sending…' : 'Resend code'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Screen>
  );
}