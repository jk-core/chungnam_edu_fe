import { useRef, useState } from 'react';
import useAssetStore from '@/stores/assetStore';
import { useLogin } from '@/stores/authStore';

export interface FormError {
  title: string;
  action: string;
}

/**
 * 로그인 시도 (SIF-001).
 *
 * 아이디를 직접 적어 들어오는 길과 데모 계정을 눌러 들어오는 길이 같은 실패 횟수를 나눠 쓴다.
 * 잠금 기준은 관리자 콘솔에서 저장한 로그인 정책을 그대로 따른다 (SFR-026).
 */
export function useSignIn() {
  const login = useLogin();
  const policy = useAssetStore((state) => state.policy);

  const [error, setError] = useState<FormError | null>(null);
  const [failCount, setFailCount] = useState(0);
  // 연속 제출이 한 렌더에 묶여도 횟수가 어긋나지 않게 최신 값을 ref 로 들고 있는다.
  const failRef = useRef(0);

  const isLocked = failCount >= policy.maxFailCount;

  // 성공하면 AuthLayout 이 원래 가려던 곳으로 보내 준다. 여기서는 계정만 세운다.
  const enter = (accountId: string) => {
    if (login(accountId)) return;

    failRef.current += 1;

    const next = failRef.current;

    setFailCount(next);
    setError(
      next >= policy.maxFailCount
        ? {
          title: `로그인 실패가 ${policy.maxFailCount}회를 넘어 입력이 잠겼습니다.`,
          action: '소속 기관 담당자에게 계정 잠금 해제를 요청하세요.',
        }
        : {
          title: '등록되지 않은 아이디입니다.',
          action: `아이디를 다시 확인해 주세요. (실패 ${next}/${policy.maxFailCount}회)`,
        },
    );
  };

  return { policy, error, isLocked, enter, warn: setError };
}
