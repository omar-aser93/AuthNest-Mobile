import { View } from 'react-native';
import { Skeleton } from '@/components/ui/skeleton';

// A skeleton card, with or without an image
export function PostCardSkeleton({ withImage = true }: { withImage?: boolean }) {
  return (
    <View
      className="border border-border rounded-xl bg-background overflow-hidden"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* Header */}
      <View className="flex-row items-center gap-2 p-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <View className="flex-1 gap-2">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-20" />
        </View>
      </View>

      {/* Body */}
      <View className="px-3 pb-2 gap-2">
        {withImage && <Skeleton className="w-full aspect-[16/10] rounded-lg" />}
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </View>

      {/* Footer */}
      <View className="flex-row gap-3 px-3 pb-3 pt-1">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </View>
    </View>
  );
}

// A few stacked cards for list loading (alternating image / text-only so it looks natural)
export function PostFeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} className="px-3 mb-3">
          <PostCardSkeleton withImage={i % 2 === 0} />
        </View>
      ))}
    </View>
  );
}