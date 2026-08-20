import type { LoginPolicy } from '@/interface/account';

/** 값 하나가 지켜야 할 것 — 입력칸도 검증도 이 표 하나를 본다 */
export interface PolicyField {
  /** 입력칸에 붙는 이름 */
  label: string;
  /** 오류 문구에 쓰는 이름 — 입력칸 이름만으로는 어느 값인지 모르는 것이 있다 */
  errorLabel: string;
  unit: string;
  min: number;
  max: number;
  /** 칸 아래 한 줄. 없으면 빈 문자열이 아니라 undefined 로 둔다 */
  hint?: string;
}

/**
 * 로그인 정책의 값 넷 (SFR-026).
 *
 * 범위를 한 곳에만 적는다. 전에는 검증하는 배열과 입력칸이 최솟값·최댓값을 따로 들고 있어,
 * 한쪽만 고치면 화면은 300 까지 받아 놓고 저장할 때 「30~365」 라고 물리는 일이 생겼다.
 */
export const POLICY_FIELDS = {
  passwordResetDays: {
    label: '재설정 주기',
    errorLabel: '비밀번호 재설정 주기',
    unit: '일',
    min: 30,
    max: 365,
  },
  maxFailCount: {
    label: '로그인 실패 허용 횟수',
    errorLabel: '로그인 실패 허용 횟수',
    unit: '회',
    min: 3,
    max: 10,
    hint: '넘으면 계정이 잠기고, 사용자 관리에서 풉니다.',
  },
  adminSessionMinutes: {
    label: '관리자',
    errorLabel: '관리자 유지시간',
    unit: '분',
    min: 10,
    max: 120,
  },
  userSessionMinutes: {
    label: '일반 사용자',
    errorLabel: '일반 사용자 유지시간',
    unit: '분',
    min: 10,
    max: 240,
  },
} as const satisfies Record<keyof LoginPolicy, PolicyField>;

export type PolicyKey = keyof typeof POLICY_FIELDS;

/** 입력 중에는 칸이 비어 있을 수 있다 — 저장할 때 숫자인지 다시 본다 */
export type PolicyDraft = Record<PolicyKey, number | ''>;
