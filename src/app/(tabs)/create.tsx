import { SignInPrompt } from "@/components/layout/SignInPrompt";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthProvider";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";

export default function CreateRoute() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) return <SignInPrompt message="Sign in to create a post" />;

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background p-6">
      <Text className="text-lg font-semibold text-foreground">Ready to post?</Text>
      <Text className="text-sm text-muted-foreground text-center max-w-xs">
        Tap below to open the create post form.
      </Text>
      <Button variant="outline" onPress={() => router.push('/create-post')}>
        <Text className="text-foreground">Create Post</Text>
      </Button>
    </View>
  );
}