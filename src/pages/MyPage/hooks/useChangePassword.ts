import { useMutation } from '@tanstack/react-query';
import { postChangePassword } from '@/service/auth';
import { serverMessageOf } from '@/service/error';
import { toast } from '@/stores/toastStore';
import type { ChangePasswordParams } from '@/service/auth/type';

/**
 * 비밀번호 변경 (SFR-024).
 *
 * 성공해도 로그아웃시키지 않는다 — 명세에 이 호출이 토큰을 무르는 자리가 없다.
 * 다른 기기를 끊으려면 계정 메뉴의 전체 로그아웃을 쓴다.
 */
export function useChangePassword(onDone: () => void) {
  const { mutate, isPending } = useMutation({
    mutationFn: (params: ChangePasswordParams) => postChangePassword(params),
    onSuccess: () => {
      toast.success('비밀번호를 변경했습니다. 다음 로그인부터 새 비밀번호를 사용하세요.');
      onDone();
    },
    // 지난 비밀번호 재사용 같은 규칙은 서버만이 알아, 내려준 문구가 있으면 그것을 쓴다.
    onError: (error) => toast.error(serverMessageOf(error) ?? '비밀번호를 바꾸지 못했습니다. 현재 비밀번호를 다시 확인해 주세요.'),
  });

  return { changePassword: mutate, isPending };
}
