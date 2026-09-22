import { useMutation } from '@tanstack/react-query';
import { postInitializePassword } from '@/service/auth';
import { serverMessageOf } from '@/service/error';
import { toast } from '@/stores/toastStore';
import type { InitializePasswordParams } from '@/service/auth/type';

/**
 * 비밀번호 초기화 (SFR-018).
 *
 * 관리자가 남의 비밀번호를 새로 정한다 — 기존 비밀번호를 묻지 않으므로 계정을 고르는 자리는
 * 로그인 ID 하나다. 정한 비밀번호는 서버가 돌려주지 않아 화면이 그 자리에서 알려 줘야 한다.
 */
export function useInitializePassword(onDone: () => void) {
  const { mutate, isPending } = useMutation({
    mutationFn: (params: InitializePasswordParams) => postInitializePassword(params),
    onSuccess: (_data, params) => {
      toast.success(`${params.loginId} 계정의 비밀번호를 초기화했습니다. 본인에게 직접 전달하세요.`);
      onDone();
    },
    // 비밀번호 규칙은 서버도 함께 보므로, 내려준 문구가 있으면 그것을 쓴다.
    onError: (error) => toast.error(serverMessageOf(error) ?? '비밀번호를 초기화하지 못했습니다. 잠시 후 다시 시도해 주세요.'),
  });

  return { initializePassword: mutate, isPending };
}
