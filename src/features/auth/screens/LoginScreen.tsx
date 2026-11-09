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
import { loginSchema, type LoginType } from '../schemas';
import { Eye, EyeOff } from '@/components/ui/icons';


export function LoginScreen() {
  const { signIn } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginType>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await signIn(values);
      // Stack.Protected unmounts (auth) once `user` is set — no manual navigation.
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Login failed';
      form.setError('root', { message });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Screen>
      <View className="mb-8 mt-6 items-center">
        <Text className="text-3xl font-bold text-foreground">Welcome back</Text>
        <Text className="mt-2 text-base text-muted-foreground">Sign in to continue</Text>
      </View>

      <View className="gap-4">
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <FormField label="Email" htmlFor="login-email" error={fieldState.error?.message}>
              <Input
                nativeID="login-email"
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
            <FormField label="Password" htmlFor="login-password" error={fieldState.error?.message}>
              <View className="relative">
                <Input
                  nativeID="login-password"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  placeholder="••••••••"
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

        <Link href="/forgot-password" className="self-end">
          <Text className="text-sm text-primary">Forgot password?</Text>
        </Link>

        {form.formState.errors.root && (
          <Text className="text-sm text-destructive">{form.formState.errors.root.message}</Text>
        )}

        <Button onPress={onSubmit} disabled={submitting} className="mt-2">
          <Text>{submitting ? 'Signing in…' : 'Sign in'}</Text>
        </Button>
      </View>

      <View className="my-6 flex-row items-center">
        <View className="flex-1 border-t border-border" />
        <Text className="mx-3 text-xs text-muted-foreground">OR</Text>
        <View className="flex-1 border-t border-border" />
      </View>

      <SocialButtons />

      <View className="mt-8 flex-row justify-center">
        <Text className="text-muted-foreground">Don't have an account? </Text>
        <Link href="/register">
          <Text className="font-semibold text-primary">Sign up</Text>
        </Link>
      </View>
    </Screen>
  );
}