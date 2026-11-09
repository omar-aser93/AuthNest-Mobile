import { useRouter } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { PostForm } from '../components/PostForm';

export function CreatePostScreen() {
  const router = useRouter();
  return (
    <Screen edges={['bottom']}>
      <PostForm onSuccess={() => router.back()} />
    </Screen>
  );
}