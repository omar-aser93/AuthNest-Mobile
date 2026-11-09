import { useState } from 'react';
import { Pressable, View, } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { FormField } from '@/components/ui/FormField';
import { ApiError } from '@/lib/api';
import { useAuth } from '../AuthProvider';
import { SocialButtons } from '../components/SocialButtons';
import { registerSchema, type RegisterType } from '../schemas';
import { Eye, EyeOff } from '@/components/ui/icons';

export function RegisterScreen() {
  const { signUp } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<RegisterType>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      const { confirmPassword, ...payload } = values;
      await signUp(payload);
      // Stack.Protected flips on `user` being set — no manual navigation.
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Signup failed';
      form.setError('root', { message });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Screen>
      <View className="mb-8 mt-6 items-center">
        <Text className="text-3xl font-bold text-foreground">Create account</Text>
        <Text className="mt-2 text-base text-muted-foreground">Join AuthNest today</Text>
      </View>

      <View className="gap-4">
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <FormField label="Name" htmlFor="reg-name" error={fieldState.error?.message}>
              <Input
                nativeID="reg-name"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                autoCapitalize="words"
                autoComplete="name"
                placeholder="Your name"
                aria-invalid={fieldState.invalid}
                className={fieldState.invalid ? 'border-destructive' : undefined}
              />
            </FormField>
          )}
        />

        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <FormField label="Email" htmlFor="reg-email" error={fieldState.error?.message}>
              <Input
                nativeID="reg-email"
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

        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <FormField label="Password" htmlFor="reg-password" error={fieldState.error?.message}>
              <View className="relative">
                <Input
                  nativeID="reg-password"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  secureTextEntry={!showPassword}
                  autoComplete="password-new"
                  placeholder="At least 6 characters"
                  aria-invalid={fieldState.invalid}
                  className={`pr-10 ${fieldState.invalid ? 'border-destructive' : ''}`}
                />
                <Pressable onPress={() => setShowPassword((s) => !s)}
                  hitSlop={8}                 
                  className="absolute bottom-0 right-2 top-0 justify-center px-1 z-10 elevation-sm"
                >
                  {showPassword ? (
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
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <FormField label="Confirm password" htmlFor="reg-confirm" error={fieldState.error?.message}>
              <View className="relative">                
                <Input
                  nativeID="reg-confirm"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="password-new"
                  placeholder="Repeat your password"
                  aria-invalid={fieldState.invalid}
                  className={`pr-10 ${fieldState.invalid ? 'border-destructive' : ''}`}
                />
                <Pressable onPress={() => setShowConfirmPassword((s) => !s)} hitSlop={8}
                  className="absolute bottom-0 right-2 top-0 justify-center px-1 z-10 elevation-sm"
                >
                  {showConfirmPassword ? (
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
          <Text>{submitting ? 'Creating...' : 'Create account'}</Text>
        </Button>
      </View>

      <View className="my-6 flex-row items-center">
        <View className="flex-1 border-t border-border" />
        <Text className="mx-3 text-xs text-muted-foreground">OR</Text>
        <View className="flex-1 border-t border-border" />
      </View>

      <SocialButtons />

      <View className="mt-8 flex-row justify-center">
        <Text className="text-muted-foreground">Already have an account? </Text>
        <Link href="/login">
          <Text className="font-semibold text-primary">Sign in</Text>
        </Link>
      </View>
    </Screen>
  );
}