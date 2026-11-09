import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api';

// queryClient used by react-query 
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && [401, 403, 404].includes(error.status ?? 0)) { return false; }
        return failureCount < 1;
      },
      refetchOnWindowFocus: true,   // works on web, mobile focus is wired via reactQuerySetup.ts
    },
  },
});