import { useEffect } from 'react';
import { View, Image, Pressable, ActivityIndicator } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { FormField } from '@/components/ui/FormField';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { formatMentionsForStorage, formatMentionsForEditing, extractMentionDetails } from '@/lib/renderWithTags';
import { useMentions } from '@/hooks/useMentions';
import { useCreateComment, useUpdateComment } from '../api';
import { commentSchema, type CommentType } from '../schemas';
import type { Comment } from '../types';

type Props = {
  postId: string;
  parentId?: string | null;       // undefined/null → top-level; set → reply
  commentToEdit?: Comment;        // present → edit mode
  onSuccess?: (comment: Comment) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
};

export function CommentForm({ postId, parentId, commentToEdit, onSuccess, onCancel, autoFocus }: Props) {
  const isEditing = Boolean(commentToEdit);
  const { user } = useAuth();
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();
  const mutation = isEditing ? updateComment : createComment;
  const mentions = useMentions();

  const form = useForm<CommentType>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: commentToEdit ? formatMentionsForEditing(commentToEdit.content) : '' },
  });

  // Seed mentions when editing.
  useEffect(() => {
    if (commentToEdit) {
      const details = extractMentionDetails(commentToEdit.content);
      if (details.length > 0) mentions.setTaggedUsers(details);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commentToEdit]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!user) return;

    try {
      const storedContent = formatMentionsForStorage(values.content, mentions.taggedUsers);
      const taggedIds = mentions.taggedUsers.map((u) => u.id);

      if (isEditing && commentToEdit) {
        await updateComment.mutateAsync({
          commentId: commentToEdit.id,
          postId,
          parentId: commentToEdit.parentId,
          content: storedContent,
          taggedUsers: taggedIds,
        });
        form.reset();
        mentions.resetMentions();
        onCancel?.();   // close edit form (was opened inline from CommentCard)
      } else {
        const created = await createComment.mutateAsync({
          postId,
          content: storedContent,
          parentId: parentId || undefined,
          taggedUsers: taggedIds,
        });
        form.reset();
        mentions.resetMentions();
        onSuccess?.(created);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : `${isEditing ? 'Update' : 'Create'} failed`;
      form.setError('root', { message });
    }
  });

  // Avatar: initials fallback if no image
  const initials = (user?.name ?? user?.email ?? '?').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <View className="gap-2">
      <View className="flex-row gap-2">
        {/* User avatar */}
        {user?.image ? (
          <Image source={{ uri: user.image }} style={{ width: 32, height: 32, borderRadius: 16 }} />
        ) : (
          <View style={{ width: 32, height: 32, borderRadius: 16 }} className="bg-secondary items-center justify-center">
            <Text className="text-xs font-bold text-foreground">{initials}</Text>
          </View>
        )}

        <View className="flex-1 gap-1">
          <Controller
            control={form.control}
            name="content"
            render={({ field, fieldState }) => (
              <FormField label="" htmlFor="comment-content" error={fieldState.error?.message}>
                <View
                  className={`rounded-lg border bg-background px-3 py-2 ${
                    fieldState.invalid ? 'border-destructive' : 'border-border'
                  }`}
                >
                  <Input
                    nativeID="comment-content"
                    value={field.value}
                    onChangeText={(t) => { field.onChange(t); mentions.handleMentionSearch(t); }}
                    onBlur={field.onBlur}
                    multiline
                    textAlignVertical="top"
                    autoFocus={autoFocus}
                    placeholder={
                      isEditing ? 'Edit your comment…'
                        : parentId ? 'Write a reply…'
                        : 'Write a comment…'
                    }
                    className="min-h-16 border-0 bg-transparent p-0"
                  />
                </View>
              </FormField>
            )}
          />

          {/* Mention dropdown */}
          {mentions.mentionResults.length > 0 && (
            <View className="rounded-lg border border-border bg-background max-h-52 overflow-hidden">
              {mentions.mentionResults.slice(0, 6).map((u) => (
                <Pressable
                  key={u.id}
                  onPress={() =>
                    mentions.insertMention(u, form.getValues('content'), (v) => form.setValue('content', v))
                  }
                  className="flex-row items-center gap-2 px-3 py-2.5 active:bg-secondary"
                >
                  {u.image ? (
                    <Image source={{ uri: u.image }} style={{ width: 24, height: 24, borderRadius: 12 }} />
                  ) : (
                    <View style={{ width: 24, height: 24, borderRadius: 12 }} className="bg-secondary items-center justify-center">
                      <Text className="text-xs font-bold">{u.name?.[0]?.toUpperCase() ?? '?'}</Text>
                    </View>
                  )}
                  <Text className="text-sm">{u.name}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>

      {form.formState.errors.root && (
        <Text className="text-sm text-destructive ms-10">{form.formState.errors.root.message}</Text>
      )}

      {/* Actions */}
      <View className="flex-row justify-end gap-2 ms-10">
        {onCancel && (
          <Button variant="ghost" onPress={onCancel} disabled={mutation.isPending}>
            <Text>Cancel</Text>
          </Button>
        )}
        <Button onPress={onSubmit} disabled={mutation.isPending}>
          {mutation.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text>{isEditing ? 'Update' : parentId ? 'Reply' : 'Comment'}</Text>
          )}
        </Button>
      </View>
    </View>
  );
}