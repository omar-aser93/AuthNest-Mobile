import { useState } from 'react';
import { View, TextInput, Image, Pressable } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from '@/components/ui/icons';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { FormField } from '@/components/ui/FormField';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { useUpdateProfile } from '../api';
import { updateProfileSchema, type UpdateProfileType } from '../schemas';


// Form component to update user profile data (name, bio, image, ...)
export function EditProfileScreen() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const updateProfile = useUpdateProfile();

  const [imageAsset, setImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);

  // React Hook Form config
  const form = useForm<UpdateProfileType>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: user?.name ?? '', bio: user?.bio ?? '' },
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8
    });
    if (!result.canceled) {
      setImageAsset(result.assets[0]);
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (!user) return;
    try {
      const updated = await updateProfile.mutateAsync({
        id: user.id, name: values.name, bio: values.bio, imageAsset
      });
      await updateUser(updated);
      router.back();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Update failed';
      form.setError('root', { message });
    }
  });

  if (!user) return null;

  // Avatar preview: newly-picked image > current image > initials fallback
  const previewUri = imageAsset?.uri ?? user.image ?? null;
  const initials = (user.name ?? user.email).split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <Screen edges={['bottom']}>
      <View className="gap-4">
        {/* Avatar picker */}
        <View className="items-center gap-2">
          <Pressable onPress={pickImage}>
            {previewUri ? (
              <Image source={{ uri: previewUri }} style={{ width: 96, height: 96, borderRadius: 48 }} />
            ) : (
              <View style={{ width: 96, height: 96, borderRadius: 48 }} className="items-center justify-center bg-secondary" >
                <Text className="text-3xl font-bold text-foreground">{initials}</Text>
              </View>
            )}

            {/* Camera badge */}
            <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary">
              <Camera size={16} className="text-primary-foreground" />
            </View>
          </Pressable>
          <Text className="text-xs text-muted-foreground">
            {imageAsset ? 'New photo selected' : 'Tap to change photo'}
          </Text>
        </View>

        {/* Email (read-only) */}
        <View className="gap-1.5">
          <Text className="text-sm font-medium text-foreground">Email</Text>
          <View className="h-11 justify-center rounded-lg border border-border bg-secondary px-3">
            <Text className="text-base text-muted-foreground">{user.email}</Text>
          </View>
        </View>

        {/* Name */}
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <FormField label="Name" htmlFor="edit-name" error={fieldState.error?.message}>
              <Input nativeID="edit-name" value={field.value}  onChangeText={field.onChange}
                onBlur={field.onBlur} aria-invalid={fieldState.invalid}
                className={fieldState.invalid ? 'border-destructive' : undefined}
              />
            </FormField>
          )}
        />

        {/* Bio */}
        <Controller
          control={form.control}
          name="bio"
          render={({ field, fieldState }) => (
            <FormField label="Bio" htmlFor="edit-bio" error={fieldState.error?.message}>
              <TextInput nativeID="edit-bio" value={field.value ?? ''} onChangeText={field.onChange}
                onBlur={field.onBlur} multiline  placeholder="Tell people about yourself"
                placeholderTextColor="#9ca3af" style={{ textAlignVertical: 'top' }}
                className={`min-h-24 rounded-lg border bg-background px-3 py-3 text-base text-foreground ${fieldState.invalid ? 'border-destructive' : 'border-border'}`}
              />
            </FormField>
          )}
        />

        {form.formState.errors.root && (
          <Text className="text-sm text-destructive">{form.formState.errors.root.message}</Text>
        )}

        <Button onPress={onSubmit} disabled={updateProfile.isPending} className="mt-2">
          <Text>{updateProfile.isPending ? 'Saving…' : 'Save'}</Text>
        </Button>
      </View>
    </Screen>
  );
}