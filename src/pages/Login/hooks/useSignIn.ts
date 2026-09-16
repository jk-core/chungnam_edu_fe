import axios from 'axios';
import { useMutation } from '@tanstack/react-query';
import { getUserInfo, postSignIn } from '@/service/auth';
import { serverMessageOf } from '@/service/error';
import { toAuthUser, useSetAuthUser, useSetSession } from '@/stores/authStore';
import type { SignInParams } from '@/service/auth/type';

export interface FormError {
  title: string;
  action: string;
}

/** 서버가 내려준 문구를 그대로 쓴다 — 실패 횟수·잠금 안내는 서버만이 정확히 안다 */
function messageOf(error: unknown): FormError {
  const serverMessage = serverMessageOf(error);

  if (serverMessage) return { title: serverMessage, action: '입력한 내용을 다시 확인해 주세요.' };

  if (axios.isAxiosError(error) && error.response?.status === 401) {
    return {
      title: '아이디 또는 비밀번호가 올바르지 않습니다.',
      action: '대소문자를 구분합니다. 반복해서 실패하면 계정이 잠깁니다.',
    };
  }

  return {
    title: '로그인 중 문제가 생겼습니다.',
    action: '잠시 후 다시 시도하고, 계속되면 소속 기관 담당자에게 문의하세요.',
  };
}

/**
 * 로그인 (SIF-001).
 *
 * 토큰을 받은 뒤 곧바로 계정을 한 번 더 받는다 — `SignInResForm` 에는 이름도 등급도 없어
 * 그것만으로는 헤더와 라우트 가드가 판정할 것이 없다. 둘이 모두 끝나야 로그인이 끝난 것이므로
 * 한 뮤테이션 안에 묶는다: 중간에 멈추면 토큰만 쥔 채 아무 화면도 열지 못한다.
 *
 * 성공 뒤 이동은 `AuthLayout` 이 맡는다 — 여기서 navigate 를 부르면 그 리다이렉트와 경쟁한다.
 */
export function useSignIn() {
  const setSession = useSetSession();
  const setUser = useSetAuthUser();

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: async (params: SignInParams) => {
      const session = await postSignIn(params);

      setSession(session);

      return getUserInfo();
    },
    onSuccess: (info) => setUser(toAuthUser(info)),
  });

  return {
    signIn: mutate,
    isPending,
    error: error ? messageOf(error) : null,
    clearError: reset,
  };
}
