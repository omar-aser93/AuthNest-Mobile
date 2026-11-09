import { useState } from 'react';
import { Pressable, View, } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { FormField } from '@/components/ui/FormField';
import { ApiError, api } from '@/lib/api';
import { resetPasswordSchema, type ResetPasswordType } from '../schemas';
import { Eye, EyeOff } from '@/components/ui/icons';

export function ResetPasswordScreen() {
  const router = useRouter();
  const { email, token } = useLocalSearchParams<{ email: string; token: string }>();
  const [submitting, setSubmitting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const form = useForm<ResetPasswordType>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: email ?? '',
      resetToken: token ?? '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await api.post('/auth/reset-password', {
        email: values.email,
        newPassword: values.newPassword,
        resetToken: values.resetToken,
      });
      router.replace('/login');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Reset failed';
      form.setError('root', { message });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Screen>
      <View className="mb-8 mt-6 items-center">
        <Text className="text-3xl font-bold text-foreground">Reset password</Text>
        <Text className="mt-2 text-center text-base text-muted-foreground">
          Choose a new secure password
        </Text>
      </View>

      <View className="gap-4">
        <Controller
          control={form.control}
          name="newPassword"
          render={({ field, fieldState }) => (
            <FormField label="New password" htmlFor="rp-new" error={fieldState.error?.message}>
              <View className="relative">
                <Input
                  nativeID="rp-new"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  secureTextEntry={!showNewPassword}
                  autoComplete="password-new"
                  placeholder="At least 6 characters"
                  aria-invalid={fieldState.invalid}
                  className={`pr-10 ${fieldState.invalid ? 'border-destructive' : ''}`}
                />
                <Pressable onPress={() => setShowNewPassword((s) => !s)} hitSlop={8}
                  className="absolute bottom-0 right-2 top-0 justify-center px-1 z-10 elevation-sm"
                > 
                  {showNewPassword ? (
                    <EyeOff size={18} className="text-muted-foreground" />
                  ) : (
                    <Eye size={18} className="text-muted-foreground" />
                  )}
                </Pressable>
              </View>  
            </FormField>
          )}
        />

        <Controller
          control={form.control}
          name="confirmNewPassword"
          render={({ field, fieldState }) => (
            <FormField label="Confirm new password" htmlFor="rp-confirm" error={fieldState.error?.message}>
              <View className="relative">
                <Input
                  nativeID="rp-confirm"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  secureTextEntry={!showConfirmNewPassword}
                  autoComplete="password-new"
                  placeholder="Repeat your password"
                  aria-invalid={fieldState.invalid}
                  className={`pr-10 ${fieldState.invalid ? 'border-destructive' : ''}`}
                />
                <Pressable onPress={() => setShowConfirmNewPassword((s) => !s)} hitSlop={8}
                  className="absolute bottom-0 right-2 top-0 justify-center px-1 z-10 elevation-sm"
                > 
                  {showConfirmNewPassword ? (
                    <EyeOff size={18} className="text-muted-foreground" />
                  ) : (
                    <Eye size={18} className="text-muted-foreground" />
                  )}
                </Pressable>
              </View>
            </FormField>
          )}
        />

        {form.formState.errors.root && (
          <Text className="text-sm text-destructive">{form.formState.errors.root.message}</Text>
        )}

        <Button onPress={onSubmit} disabled={submitting} className="mt-2">          
          <Text>{submitting ? 'Updating...' : 'Update password'}</Text>
        </Button>
      </View>
    </Screen>
  );
}