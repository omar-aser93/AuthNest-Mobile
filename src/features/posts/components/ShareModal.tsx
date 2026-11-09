import { Modal, View, TextInput, Pressable, Alert, Share as RNShare } from 'react-native';
import { useState } from 'react';
import { FriendPrivacySelector } from '@/features/friends/components/FriendPrivacySelector';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Globe, Users, Lock, Share2, X } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { ApiError } from '@/lib/api';
import { useSharePost } from '../api';
import { shareSchema, type ShareType } from '../schemas';
import type { Post } from '../types';

const PRIVACY_OPTIONS = [
  { value: 'PUBLIC'  as const, icon: Globe,  label: 'Public'   },
  { value: 'FRIENDS' as const, icon: Users,  label: 'Friends'  },
  { value: 'ONLY_ME' as const, icon: Lock,   label: 'Only me'  },
];

type Props = {
  post: Post;
  visible: boolean;
  onClose: () => void;
};

export function ShareModal({ post, visible, onClose }: Props) {
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const sharePost = useSharePost();

  const form = useForm<ShareType>({
    resolver: zodResolver(shareSchema),
    defaultValues: { message: '', privacy: 'PUBLIC' },
  });

  const onSubmit = form.handleSubmit((values) => {
    sharePost.mutate(
      { postId: post.id, message: values.message?.trim() || undefined, privacy: values.privacy, blocked: blockedIds },
      {
        onSuccess: () => {
          form.reset();
          setBlockedIds([]);
          onClose();
        },
        onError: (err) => {
          form.setError('root', { message: err instanceof ApiError ? err.message : 'Share failed' });
        },
      },
    );
  });

  // Native OS share sheet — this is the "external" path. Sends a text fragment
  // + title (if any). No URL because mobile has no public web origin; 
  // the user can add one via EXPO_PUBLIC_FRONTEND_ORIGIN when the web app is deployed.
  const onNativeShare = async () => {
    try {
      const origin = process.env.EXPO_PUBLIC_FRONTEND_ORIGIN;
      const url = origin ? `${origin}/posts/${post.id}` : '';
      const body = [post.title, post.content?.slice(0, 120), url].filter(Boolean).join('\n\n');
      await RNShare.share({ message: body || 'Check out this post on AuthNest' });
    } catch {
      // user dismissed the sheet — no-op
    }
  };

  const close = () => { form.reset(); setBlockedIds([]); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <Pressable className="flex-1 justify-center bg-black/50 px-6" onPress={close}>
        <Pressable className="gap-4 rounded-2xl bg-background p-5" onPress={() => {}}>
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-foreground">Share post</Text>
            <Pressable onPress={close} hitSlop={8} className="p-1 rounded-md active:bg-secondary">
              <X size={18} className="text-muted-foreground" />
            </Pressable>
          </View>

          {/* Message */}
          <Controller
            control={form.control}
            name="message"
            render={({ field, fieldState }) => (
              <View className="gap-1">
                <TextInput
                  value={field.value ?? ''}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  multiline
                  placeholder="Say something about this… (optional)"
                  placeholderTextColor="#9ca3af"
                  style={{ textAlignVertical: 'top' }}
                  className={`min-h-20 rounded-lg border bg-background px-3 py-2 text-base text-foreground ${
                    fieldState.invalid ? 'border-destructive' : 'border-border'
                  }`}
                />
                {fieldState.error && (
                  <Text className="text-xs text-destructive">{fieldState.error.message}</Text>
                )}
              </View>
            )}
          />

          {/* Privacy — segmented control */}
          <Controller
            control={form.control}
            name="privacy"
            render={({ field }) => (
              <View className="flex-row gap-1 rounded-lg bg-secondary p-1">
                {PRIVACY_OPTIONS.map(({ value, icon: Icon, label }) => {
                  const active = field.value === value;
                  return (
                    <Pressable
                      key={value}
                      onPress={() => field.onChange(value)}
                      className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-md px-2 py-2 ${
                        active ? 'bg-background' : ''
                      }`}
                    >
                      <Icon size={14} className={active ? 'text-foreground' : 'text-muted-foreground'} />
                      <Text className={`text-xs font-medium ${
                        active ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          />

          {form.watch('privacy') !== 'ONLY_ME' && (
            <FriendPrivacySelector
                allowedIds={[]}
                blockedIds={blockedIds}
                setAllowedIds={() => {}}          // not used in block-only mode
                setBlockedIds={setBlockedIds}
                mode="block-only"
            />
          )}

          {/* Root error */}
          {form.formState.errors.root && (
            <Text className="text-sm text-destructive">{form.formState.errors.root.message}</Text>
          )}

          {/* Internal share submit */}
          <Button onPress={onSubmit} disabled={sharePost.isPending}>
            <Text>{sharePost.isPending ? 'Sharing…' : 'Share to my feed'}</Text>
          </Button>

          {/* Divider */}
          <View className="flex-row items-center gap-2">
            <View className="h-px flex-1 bg-border" />
            <Text className="text-xs text-muted-foreground">or</Text>
            <View className="h-px flex-1 bg-border" />
          </View>

          {/* Native OS share (external) */}
          <Button variant="outline" onPress={onNativeShare}>
            <Share2 size={16} className="text-foreground" />
            <Text className="ms-2">Share via app…</Text>
          </Button>
        </Pressable>
      </Pressable>
    </Modal>
  );
}