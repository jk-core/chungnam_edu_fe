import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postLogout, postLogoutAll } from '@/service/auth';
import { toast } from '@/stores/toastStore';
import { useClearSession } from '@/stores/authStore';

/**
 * 로그아웃 (SIF-001).
 *
 * 서버가 거절해도 이 브라우저의 세션은 지운다 — 나가겠다고 누른 사람을 화면에 붙잡아 두면
 * 토큰이 남은 채로 계속 조회가 나간다. 서버에 남은 토큰은 만료되며 사라진다.
 *
 * 캐시도 함께 비운다: 다음 사람이 같은 브라우저로 들어왔을 때 앞사람이 보던 값이 잠깐 비친다.
 */
export function useLogout() {
  const clear = useClearSession();
  const queryClient = useQueryClient();

  const finish = (message: string) => {
    clear();
    queryClient.clear();
    toast.info(message);
  };

  const { mutate: logout, isPending } = useMutation({
    mutationFn: postLogout,
    onSuccess: () => finish('로그아웃했습니다.'),
    onError: () => finish('로그아웃했습니다. 서버 응답은 받지 못했습니다.'),
  });

  const { mutate: logoutAll, isPending: isPendingAll } = useMutation({
    mutationFn: postLogoutAll,
    onSuccess: () => finish('로그인해 둔 모든 기기에서 로그아웃했습니다.'),
    onError: () => finish('로그아웃했습니다. 서버 응답은 받지 못했습니다.'),
  });

  return { logout, logoutAll, isPending: isPending || isPendingAll };
}
