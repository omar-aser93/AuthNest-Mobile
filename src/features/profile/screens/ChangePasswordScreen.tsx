import { useState } from 'react';
import { View, Pressable, Alert } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from '@/components/ui/icons';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { FormField } from '@/components/ui/FormField';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { useChangePassword } from '../api';
import { changePasswordSchema, type ChangePasswordType } from '../schemas';


// Form component for changing password
export function ChangePasswordScreen() {
  const { user, signOut } = useAuth();
  const changePassword = useChangePassword();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<ChangePasswordType>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (!user) return;
    try {
      await changePassword.mutateAsync({
        id: user.id,
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      // Backend deleted ALL sessions on password change (see changePassword controller).
      // The client must sign out too, or it'll hit 401 on the next request.
      Alert.alert('Password updated', 'Please sign in again with your new password.',
        [{ text: 'OK', onPress: () => signOut() }],
        { cancelable: false },
      );
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to change password';
      form.setError('root', { message });
    }
  });

  if (!user) return null;

  return (
    <Screen edges={['bottom']}>
      <View className="gap-4">
        {/* Current password */}
        <Controller
          control={form.control}
          name="currentPassword"
          render={({ field, fieldState }) => (
            <FormField label="Current password" htmlFor="cp-current" error={fieldState.error?.message}>
              <View className="relative">
                <Input nativeID="cp-current" value={field.value} onChangeText={field.onChange}
                  onBlur={field.onBlur} secureTextEntry={!showCurrent}  aria-invalid={fieldState.invalid}
                  className={`pr-10 ${fieldState.invalid ? 'border-destructive' : ''}`}
                />
                <Pressable
                  onPress={() => setShowCurrent((s) => !s)} hitSlop={8}
                  className="absolute bottom-0 right-2 top-0 justify-center px-1 z-10 elevation-sm"
                >
                  {showCurrent ? <EyeOff size={18} className="text-muted-foreground" /> : <Eye size={18} className="text-muted-foreground" />}
                </Pressable>
              </View>
            </FormField>
          )}
        />

        {/* New password */}
        <Controller
          control={form.control}
          name="newPassword"
          render={({ field, fieldState }) => (
            <FormField label="New password" htmlFor="cp-new" error={fieldState.error?.message}>
              <View className="relative">
                <Input nativeID="cp-new" value={field.value} onChangeText={field.onChange}
                  onBlur={field.onBlur} secureTextEntry={!showNew} aria-invalid={fieldState.invalid}
                  className={`pr-10 ${fieldState.invalid ? 'border-destructive' : ''}`}
                />
                <Pressable
                  onPress={() => setShowNew((s) => !s)} hitSlop={8} 
                  className="absolute bottom-0 right-2 top-0 justify-center px-1 z-10 elevation-sm"
                >
                  {showNew ? <EyeOff size={18} className="text-muted-foreground" /> : <Eye size={18} className="text-muted-foreground" />}
                </Pressable>
              </View>
            </FormField>
          )}
        />

        {/* Confirm new password */}
        <Controller
          control={form.control}
          name="confirmNewPassword"
          render={({ field, fieldState }) => (
            <FormField label="Confirm new password" htmlFor="cp-confirm" error={fieldState.error?.message}>
              <View className="relative">
                <Input nativeID="cp-confirm" value={field.value} onChangeText={field.onChange}
                  onBlur={field.onBlur} secureTextEntry={!showConfirm} aria-invalid={fieldState.invalid}
                  className={`pr-10 ${fieldState.invalid ? 'border-destructive' : ''}`}
                />
                <Pressable
                  onPress={() => setShowConfirm((s) => !s)} hitSlop={8}
                  className="absolute bottom-0 right-2 top-0 justify-center px-1 z-10 elevation-sm"
                >
                  {showConfirm ? <EyeOff size={18} className="text-muted-foreground" /> : <Eye size={18} className="text-muted-foreground" />}
                </Pressable>
              </View>
            </FormField>
          )}
        />

        {form.formState.errors.root && (
          <Text className="text-sm text-destructive">{form.formState.errors.root.message}</Text>
        )}

        <Button onPress={onSubmit} disabled={changePassword.isPending} className="mt-2">
          <Text>{changePassword.isPending ? 'Updating…' : 'Change password'}</Text>
        </Button>
      </View>
    </Screen>
  );
}