import { useState } from 'react';
import { View, Pressable, Image, ActivityIndicator, ScrollView } from 'react-native';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus, X, Globe, Users, Lock, Settings2 } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { FormField } from '@/components/ui/FormField';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { formatMentionsForStorage, formatMentionsForEditing, extractMentionDetails } from '@/lib/renderWithTags';
import { useMentions } from '@/hooks/useMentions';
import { FriendPrivacySelector } from '@/features/friends/components/FriendPrivacySelector';
import { useCreatePost, useUpdatePost } from '../api';
import { createPostSchema, updateSharedPostSchema, type CreatePostType } from '../schemas';
import type { Post } from '../types';

const PRIVACY_OPTIONS = [
  { value: 'PUBLIC'  as const, label: 'Public',  icon: Globe,     desc: 'Anyone can see' },
  { value: 'FRIENDS' as const, label: 'Friends', icon: Users,     desc: 'Only your friends' },
  { value: 'ONLY_ME' as const, label: 'Only me', icon: Lock,      desc: 'Private' },
  { value: 'CUSTOM'  as const, label: 'Custom',  icon: Settings2, desc: 'Pick who can see' },
];

type Props = {
  post?: Post | null;
  onSuccess?: () => void;
};

export function PostForm({ post, onSuccess }: Props) {
  const isUpdate = Boolean(post);
  const isSharedPost = Boolean(post?.isShared || post?.originalPost);    
  const { user } = useAuth();
  const createPost = useCreatePost();
  const updatePost = useUpdatePost();
  const mutation = isUpdate ? updatePost : createPost;
  const mentions = useMentions();

  const [allowedIds, setAllowedIds] = useState<string[]>(post?.allowed ?? []);
  const [blockedIds, setBlockedIds] = useState<string[]>(post?.blocked ?? []);
  const [imageAsset, setImageAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  // Conditional schema: shared posts skip title/content-min validations
  const form = useForm<CreatePostType>({
    resolver: (isSharedPost
      ? zodResolver(updateSharedPostSchema)
      : zodResolver(createPostSchema)) as Resolver<CreatePostType>,
    defaultValues: {
      title: post?.title ?? '',
      content: formatMentionsForEditing(post?.content ?? ''),
      privacy: post?.privacy ?? 'PUBLIC',
    },
  });

  if (isUpdate && post?.content && mentions.taggedUsers.length === 0) {
    const details = extractMentionDetails(post.content);
    if (details.length > 0) mentions.setTaggedUsers(details);
  }

  const privacy = useWatch({ control: form.control, name: 'privacy' });
  const privacyMeta = PRIVACY_OPTIONS.find((o) => o.value === privacy) ?? PRIVACY_OPTIONS[0];

  // For shared posts, hide CUSTOM (backend share endpoint rejects it; safer to not offer it)
  const privacyOptions = isSharedPost
    ? PRIVACY_OPTIONS.filter((o) => o.value !== 'CUSTOM')
    : PRIVACY_OPTIONS;

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 10],
      quality: 0.8,
    });
    if (!res.canceled) setImageAsset(res.assets[0]);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    if (!user) return;

    // CUSTOM check still applies for regular posts, but shared posts can't be CUSTOM
    if (!isSharedPost && values.privacy === 'CUSTOM' && allowedIds.length === 0) {
      form.setError('root', { message: 'Pick at least one allowed user for custom privacy' });
      return;
    }

    try {
      const payload = {
        title: isSharedPost ? '' : values.title,        // ← empty for shares; backend ignores
        content: formatMentionsForStorage(values.content, mentions.taggedUsers),
        privacy: values.privacy,
        taggedUsers: mentions.taggedUsers.map((u) => u.id),
        allowed: !isSharedPost && values.privacy === 'CUSTOM' ? allowedIds : undefined,
        blocked: values.privacy !== 'ONLY_ME' ? blockedIds : undefined,
        imageUri: imageAsset?.uri,
        imageName: imageAsset?.fileName ?? undefined,
        imageType: imageAsset?.mimeType ?? undefined,
      };

      if (isUpdate && post) {
        await updatePost.mutateAsync({ ...payload, id: post.id });
      } else {
        await createPost.mutateAsync(payload);
      }

      mentions.resetMentions();
      onSuccess?.();
    } catch (err) {
      form.setError('root', {
        message: err instanceof ApiError ? err.message : `${isUpdate ? 'Update' : 'Create'} failed`,
      });
    }
  });

  const previewUri = imageAsset?.uri ?? post?.image ?? null;

  return (
    <ScrollView contentContainerClassName="gap-4 pb-6" keyboardShouldPersistTaps="handled">
      {/* Title — hidden for shared posts */}
      {!isSharedPost && (
        <Controller
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <FormField label="Title" htmlFor="post-title" error={fieldState.error?.message}>
              <Input
                nativeID="post-title"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="What's this post about?"
                aria-invalid={fieldState.invalid}
                className={fieldState.invalid ? 'border-destructive' : undefined}
              />
            </FormField>
          )}
        />
      )}

      {/* Content / share message — label differs */}
      <View className="relative">
        <Controller
          control={form.control}
          name="content"
          render={({ field, fieldState }) => (
            <FormField
              label={isSharedPost ? 'Message' : 'Content'}
              htmlFor="post-content"
              error={fieldState.error?.message}
            >
              <View
                className={`min-h-32 rounded-lg border bg-background px-3 py-3 ${
                  fieldState.invalid ? 'border-destructive' : 'border-border'
                }`}
              >
                <Input
                  nativeID="post-content"
                  value={field.value}
                  onChangeText={(t) => { field.onChange(t); mentions.handleMentionSearch(t); }}
                  onBlur={field.onBlur}
                  multiline
                  textAlignVertical="top"
                  placeholder={
                    isSharedPost
                      ? 'Say something about this post… (optional)'
                      : 'Write something… use @ to mention, # for hashtags'
                  }
                  className="min-h-24 border-0 bg-transparent p-0"
                />
              </View>
            </FormField>
          )}
        />

        {mentions.mentionResults.length > 0 && (
          <View className="mt-1 rounded-lg border border-border bg-background max-h-52 overflow-hidden">
            {mentions.mentionResults.slice(0, 6).map((u) => (
              <Pressable
                key={u.id}
                onPress={() => mentions.insertMention(u, form.getValues('content'), (v) => form.setValue('content', v))}
                className="flex-row items-center gap-2 px-3 py-2.5 active:bg-secondary"
              >
                {u.image ? (
                  <Image source={{ uri: u.image }} style={{ width: 28, height: 28, borderRadius: 14 }} />
                ) : (
                  <View
                    style={{ width: 28, height: 28, borderRadius: 14 }}
                    className="bg-secondary items-center justify-center"
                  >
                    <Text className="text-xs font-bold">{u.name?.[0]?.toUpperCase() ?? '?'}</Text>
                  </View>
                )}
                <Text className="text-sm">{u.name}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Image picker — hide for shared posts (edit what you shared, not the image) */}
      {!isSharedPost && (
        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">Photo</Text>
          {previewUri ? (
            <View className="relative">
              <Image
                source={{ uri: previewUri }}
                style={{ width: '100%', aspectRatio: 16 / 10, borderRadius: 12 }}
                resizeMode="cover"
              />
              {imageAsset && (
                <Pressable
                  onPress={() => setImageAsset(null)}
                  className="absolute top-2 right-2 h-8 w-8 items-center justify-center rounded-full bg-black/60"
                >
                  <X size={18} className="text-white" />
                </Pressable>
              )}
            </View>
          ) : (
            <Pressable
              onPress={pickImage}
              className="h-32 rounded-lg border border-dashed border-border items-center justify-center bg-secondary/30 active:bg-secondary"
            >
              <ImagePlus size={28} className="text-muted-foreground mb-1" />
              <Text className="text-sm text-muted-foreground">Add a photo</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Privacy */}
      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">Privacy</Text>

        <Pressable
          onPress={() => setPrivacyOpen(!privacyOpen)}
          className="flex-row items-center justify-between rounded-lg border border-border px-3 py-3 active:bg-secondary"
        >
          <View className="flex-row items-center gap-2">
            <privacyMeta.icon size={18} className="text-foreground" />
            <Text className="text-base">{privacyMeta.label}</Text>
            <Text className="text-xs text-muted-foreground">— {privacyMeta.desc}</Text>
          </View>
        </Pressable>

        {privacyOpen && (
          <View className="rounded-lg border border-border overflow-hidden">
            {privacyOptions.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => { form.setValue('privacy', opt.value); setPrivacyOpen(false); }}
                className={`flex-row items-center gap-3 px-3 py-3 active:bg-secondary ${
                  privacy === opt.value ? 'bg-secondary' : ''
                }`}
              >
                <opt.icon size={18} className="text-foreground" />
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">{opt.label}</Text>
                  <Text className="text-xs text-muted-foreground">{opt.desc}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* Friend selector — CUSTOM only for regular posts, block-only for PUBLIC/FRIENDS */}
        {!isSharedPost && privacy === 'CUSTOM' && (
          <FriendPrivacySelector
            allowedIds={allowedIds}
            blockedIds={blockedIds}
            setAllowedIds={setAllowedIds}
            setBlockedIds={setBlockedIds}
            mode="custom"
          />
        )}
        {(privacy === 'PUBLIC' || privacy === 'FRIENDS') && (
          <FriendPrivacySelector
            allowedIds={[]}
            blockedIds={blockedIds}
            setAllowedIds={() => {}}
            setBlockedIds={setBlockedIds}
            mode="block-only"
          />
        )}
      </View>

      {form.formState.errors.root && (
        <Text className="text-sm text-destructive">{form.formState.errors.root.message}</Text>
      )}

      <Button onPress={onSubmit} disabled={mutation.isPending} className="mt-2">
        {mutation.isPending ? (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator color="#fff" size="small" />
            <Text>{isUpdate ? 'Saving…' : 'Creating…'}</Text>
          </View>
        ) : (
          <Text>{isUpdate ? 'Update Post' : 'Create Post'}</Text>
        )}
      </Button>
    </ScrollView>
  );
}