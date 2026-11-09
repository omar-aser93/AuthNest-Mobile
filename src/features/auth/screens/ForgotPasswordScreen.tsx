import { useState } from 'react';
import { View } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { FormField } from '@/components/ui/FormField';
import { ApiError, api } from '@/lib/api';
import { forgotPasswordSchema, type ForgotPasswordType } from '../schemas';

export function ForgotPasswordScreen() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ForgotPasswordType>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await api.post('/auth/forgot-password', values);
      router.push({ pathname: '/verify-otp', params: { email: values.email } });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to send code';
      form.setError('root', { message });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Screen>
      <View className="mb-8 mt-6 items-center">
        <Text className="text-3xl font-bold text-foreground">Forgot password</Text>
        <Text className="mt-2 text-center text-base text-muted-foreground">
          Enter your email to receive a reset code
        </Text>
      </View>

      <View className="gap-4">
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <FormField label="Email" htmlFor="fp-email" error={fieldState.error?.message}>
              <Input
                nativeID="fp-email"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="you@example.com"
                aria-invalid={fieldState.invalid}
                className={fieldState.invalid ? 'border-destructive' : undefined}
              />
            </FormField>
          )}
        />

        {form.formState.errors.root && (
          <Text className="text-sm text-destructive">{form.formState.errors.root.message}</Text>
        )}

        <Button onPress={onSubmit} disabled={submitting} className="mt-2">
          <Text>{submitting ? 'Sending...' : 'Send code'}</Text>
        </Button>
      </View>

      <View className="mt-8 flex-row justify-center">
        <Text className="text-muted-foreground">Remembered it? </Text>
        <Link href="/login">
          <Text className="font-semibold text-primary">Sign in</Text>
        </Link>
      </View>
    </Screen>
  );
}