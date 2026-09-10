import { useEffect } from 'react';
import { MotionConfig } from 'motion/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { applyTheme, useTheme } from '@/stores/themeStore';
import { pruneExpiredSession } from '@/stores/authStore';
import type { ReactNode } from 'react';

interface ProviderProps {
  children: ReactNode;
}

// 새로고침 시점에 이미 만료된 세션은 화면을 그리기 전에 정리한다.
pruneExpiredSession();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 모니터링 값은 수집 주기를 따라가므로 창을 다시 잡을 때마다 받지 않는다.
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60 * 1000,
    },
  },
});

/** 전역 모션 정책과 테마 부트스트랩을 담당한다. */
export default function Provider({ children }: ProviderProps) {
  const theme = useTheme();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user" transition={{ ease: [0.22, 0.68, 0.32, 1] }}>
        {children}
      </MotionConfig>
    </QueryClientProvider>
  );
}
