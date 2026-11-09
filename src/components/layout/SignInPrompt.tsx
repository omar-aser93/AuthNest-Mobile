import { View } from 'react-native';
import { Lock } from '@/components/ui/icons';
import { Link } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

type SignInPromptProps = {
  message?: string;
};

// `SignInPrompt` component, used in private tabs routes, it renders a sign in button that links to `/login` route
export function SignInPrompt({ message = 'Sign in to continue' }: SignInPromptProps) {
  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <View className="mb-6 h-16 w-16 items-center justify-center rounded-full bg-secondary">
        <Lock size={28} className="text-muted-foreground" />
      </View>
      <Text className="mb-2 text-center text-lg font-semibold text-foreground">
        {message}
      </Text>
      <Text className="mb-8 text-center text-sm text-muted-foreground">
        Create an account or sign in to access this feature.
      </Text>
      <Link href="/login" asChild>
        <Button className="w-full max-w-xs">
          <Text>Sign in</Text>
        </Button>
      </Link>
    </View>
  );
}