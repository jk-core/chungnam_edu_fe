import type { Role } from '@/interface/account';
import type { RtuStatus } from '@/interface/status';
import { REGIONS } from './regions';

/*
  관리자 콘솔이 주고받는 코드값 (PPI Solar V2 API 규격).

  서버는 권한·인버터 타입·위상 같은 값을 정수 코드로 주고받는다. 화면은 한국어 라벨을 쓰지만
  폼이 담는 값은 코드여야 나중에 API 를 붙일 때 그대로 실려 나간다.
  실제 호출은 아직 없고, 폼과 목록이 담는 모양만 규격에 맞춰 둔다.
*/

// ── 사용자 권한 (userTypeCode) ─────────────────────────────

export const USER_TYPE_CODE = {
  admin: 2001,
  office: 2003,
  institution: 2002,
} as const satisfies Record<Role, number>;

export const USER_TYPE_NAME: Record<number, string> = {
  2001: '교육청 관리자',
  2003: '교육청 담당자',
  2002: '교육기관 담당자',
};

/** 코드에서 역할로 되돌린다 — 목록 응답이 코드만 줄 때 쓴다. */
export function roleOfUserType(code: number): Role {
  return (Object.keys(USER_TYPE_CODE) as Role[]).find((role) => USER_TYPE_CODE[role] === code) ?? 'institution';
}

// ── 인버터 타입 (inverterTypeCode) ─────────────────────────

export const INVERTER_TYPE_CODE = {
  general: 31001,
  string: 31002,
  central: 31003,
  micro: 31004,
} as const;

export const INVERTER_TYPE_NAME: Record<number, string> = {
  31001: '일반 인버터',
  31002: '스트링 인버터',
  31003: '센트럴 인버터',
  31004: '마이크로 인버터',
};

// ── 위상 (phaseTypeCode) ───────────────────────────────────

export const PHASE_TYPE_CODE = {
  three: 18001,
  single: 18002,
} as const;

export const PHASE_TYPE_NAME: Record<number, string> = {
  18001: '삼상',
  18002: '단상',
};

// ── 모듈 셀 종류 (cellType) ────────────────────────────────

/** 0 = 단면, 1 = 양면 */
export const CELL_TYPE_CODE = { single: 0, double: 1 } as const;

export const CELL_TYPE_NAME: Record<number, string> = {
  0: '단면',
  1: '양면',
};

// ── RTU 통신 상태 (rtuCommunicationStateCode) ──────────────

export const RTU_STATE_CODE = {
  normal: 7002,
  abnormal: 7003,
  disconnected: 7001,
} as const satisfies Record<RtuStatus, number>;

export const RTU_STATE_NAME: Record<number, string> = {
  7002: '가동중',
  7003: '비정상',
  7001: '연계 두절',
};

// ── 지역 코드 (regionCode) ─────────────────────────────────

/*
  서버는 지역을 5자리 숫자 문자열로 다룬다. 목업은 시·군을 영문 키로 갖고 있어,
  나열 순서대로 코드를 매겨 둘을 잇는다 — 값 자체는 규격을 맞추기 위한 자리다.
*/
export const REGION_CODES = REGIONS.map((region, index) => ({
  regionCode: `44${String((index + 1) * 10).padStart(3, '0')}`,
  key: region.code,
  name: region.name,
}));

export function regionCodeOf(key: string): string {
  return REGION_CODES.find((item) => item.key === key)?.regionCode ?? REGION_CODES[0].regionCode;
}

export function regionNameOfCode(code: string): string {
  return REGION_CODES.find((item) => item.regionCode === code)?.name ?? '';
}
