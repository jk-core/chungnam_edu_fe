import { z } from 'zod';

/*
  BE 코드 테이블의 단일 출처.

  응답의 `~Code` 는 여기 있는 스키마로 받고, `~Name` 은 BE 가 짝으로 내려주는 것을 화면이
  그대로 적는다. 색·정렬 순서·발전량 계수처럼 화면이 정하는 것은 여기 두지 않는다 —
  그것은 화면 어휘(`OperationStatus` 등)가 쥐고, 코드↔어휘 변환은 경계 함수 한 쌍이 맡는다.

  값을 여기 두는 것은 서버 응답과 맞대 볼 근거를 코드에 남기기 위함이다. 주석에만 적어 두면
  대조할 것이 없다.
*/

/**
 * 발전소·설비 운전상태 (statusCode / statusName).
 *
 * **설비 상태와 알림 구분이 같은 축이다.** 알림에는 7003·7004·7998 만 실린다 — 정상·준비중은
 * 알릴 일이 아니다. 축을 가르면 「경고 설비」의 알림이 다른 어휘로 떠 둘이 겹친다.
 * 고장진단은 이 축으로 접힌다 (`mocks/faultCodes.ts` 의 `FAULT_BY_STATUS`).
 *
 * 조치 상태(미조치·해결)는 이 축이 아니다 — 알림의 actionCompleteDtm 이 가른다.
 */
export const ZodStatusCode = {
  CODE: z.union([z.literal(7001), z.literal(7002), z.literal(7003), z.literal(7004), z.literal(7998)]),
  NAME: z.enum(['준비중', '정상', '주의', '경고', '통신단절']),
};
export type StatusCode = z.infer<typeof ZodStatusCode.CODE>;
export type StatusName = z.infer<typeof ZodStatusCode.NAME>;

export const STATUS_TYPE = {
  CODE: { 준비중: 7001, 정상: 7002, 주의: 7003, 경고: 7004, 통신단절: 7998 },
  NAME: { 7001: '준비중', 7002: '정상', 7003: '주의', 7004: '경고', 7998: '통신단절' },
} as const satisfies { CODE: Record<StatusName, StatusCode>; NAME: Record<StatusCode, StatusName> };

/** 계정 등급 (userTypeCode) */
export const ZodUserTypeCode = {
  CODE: z.union([
    z.literal(2002),
    z.literal(2005),
    z.literal(2010),
    z.literal(2997),
    z.literal(2998),
    z.literal(2999),
  ]),
  NAME: z.enum(['기관담당자', '그룹관리자', '교육지원청', '관리자(도교육청)', '슈퍼관리자', '개발자']),
};
export type UserTypeCode = z.infer<typeof ZodUserTypeCode.CODE>;
export type UserTypeName = z.infer<typeof ZodUserTypeCode.NAME>;

export const USER_TYPE = {
  CODE: {
    기관담당자: 2002,
    그룹관리자: 2005,
    교육지원청: 2010,
    '관리자(도교육청)': 2997,
    슈퍼관리자: 2998,
    개발자: 2999,
  },
  NAME: {
    2002: '기관담당자',
    2005: '그룹관리자',
    2010: '교육지원청',
    2997: '관리자(도교육청)',
    2998: '슈퍼관리자',
    2999: '개발자',
  },
} as const satisfies { CODE: Record<UserTypeName, UserTypeCode>; NAME: Record<UserTypeCode, UserTypeName> };

/**
 * 인버터 타입 (inverterTypeCode) — 이 값이 인버터 아래 계층을 가른다.
 * 표기는 사내 다른 프로젝트(ppi)의 코드 테이블을 그대로 따른다.
 */
export const ZodInverterTypeCode = {
  CODE: z.union([z.literal(31000), z.literal(31001), z.literal(31002), z.literal(31003)]),
  NAME: z.enum(['일반 인버터', '스트링 인버터', '센트럴 인버터', '마이크로 인버터']),
};
export type InverterTypeCode = z.infer<typeof ZodInverterTypeCode.CODE>;
export type InverterTypeName = z.infer<typeof ZodInverterTypeCode.NAME>;

export const INVERTER_TYPE = {
  CODE: {
    '일반 인버터': 31000,
    '스트링 인버터': 31001,
    '센트럴 인버터': 31002,
    '마이크로 인버터': 31003,
  },
  NAME: {
    31000: '일반 인버터',
    31001: '스트링 인버터',
    31002: '센트럴 인버터',
    31003: '마이크로 인버터',
  },
} as const satisfies {
  CODE: Record<InverterTypeName, InverterTypeCode>;
  NAME: Record<InverterTypeCode, InverterTypeName>;
};

/** 위상 종류 (phaseTypeCode) */
export const ZodPhaseTypeCode = {
  CODE: z.union([z.literal(18001), z.literal(18002)]),
  NAME: z.enum(['단상', '삼상']),
};
export type PhaseTypeCode = z.infer<typeof ZodPhaseTypeCode.CODE>;
export type PhaseTypeName = z.infer<typeof ZodPhaseTypeCode.NAME>;

export const PHASE_TYPE = {
  CODE: { 단상: 18001, 삼상: 18002 },
  NAME: { 18001: '단상', 18002: '삼상' },
} as const satisfies { CODE: Record<PhaseTypeName, PhaseTypeCode>; NAME: Record<PhaseTypeCode, PhaseTypeName> };

/** 모듈 셀 종류 (cellTypeCode) */
export const ZodCellTypeCode = {
  CODE: z.union([z.literal(0), z.literal(1)]),
  NAME: z.enum(['단면', '양면']),
};
export type CellTypeCode = z.infer<typeof ZodCellTypeCode.CODE>;
export type CellTypeName = z.infer<typeof ZodCellTypeCode.NAME>;

export const CELL_TYPE = {
  CODE: { 단면: 0, 양면: 1 },
  NAME: { 0: '단면', 1: '양면' },
} as const satisfies { CODE: Record<CellTypeName, CellTypeCode>; NAME: Record<CellTypeCode, CellTypeName> };

/**
 * 수집 데이터 자체의 상태 (dataStateCode / dataStateName).
 *
 * 설비 고장이 아니라 RTU 가 실어 온 값의 상태다 — 운전이력 표의 결측 표시가 이 축이다.
 * 화면은 세 단계(`RawDataState`)로 묶어 보는데, 열 코드를 셋으로 접는 규칙은 아직 BE 와
 * 맞추지 않았다 (`interface/operation.ts` 참조).
 */
export const ZodDataStateCode = {
  CODE: z.union([
    z.literal(28001),
    z.literal(28002),
    z.literal(28003),
    z.literal(28004),
    z.literal(28005),
    z.literal(28006),
    z.literal(28007),
    z.literal(28008),
    z.literal(28009),
    z.literal(28010),
  ]),
  NAME: z.enum([
    '정상',
    'TIME-OUT',
    '프로토콜에러',
    '인버터 고장',
    '발전량 임계치 초과',
    '누적값 감소',
    '누적값 0',
    '누적값 음수',
    '누적값초과',
    '누적값 없음(NULL)',
  ]),
};
export type DataStateCode = z.infer<typeof ZodDataStateCode.CODE>;
export type DataStateName = z.infer<typeof ZodDataStateCode.NAME>;

export const DATA_STATE = {
  CODE: {
    정상: 28001,
    'TIME-OUT': 28002,
    프로토콜에러: 28003,
    '인버터 고장': 28004,
    '발전량 임계치 초과': 28005,
    '누적값 감소': 28006,
    '누적값 0': 28007,
    '누적값 음수': 28008,
    누적값초과: 28009,
    '누적값 없음(NULL)': 28010,
  },
  NAME: {
    28001: '정상',
    28002: 'TIME-OUT',
    28003: '프로토콜에러',
    28004: '인버터 고장',
    28005: '발전량 임계치 초과',
    28006: '누적값 감소',
    28007: '누적값 0',
    28008: '누적값 음수',
    28009: '누적값초과',
    28010: '누적값 없음(NULL)',
  },
} as const satisfies { CODE: Record<DataStateName, DataStateCode>; NAME: Record<DataStateCode, DataStateName> };

/**
 * AI 진단 고장코드 (faultCode).
 *
 * 이름은 두지 않는다 — 원인·조치방안까지 든 사전이 `mocks/faultCodes.ts` 에 따로 있고,
 * 응답은 `faultCodeName` 을 짝으로 내려준다. 여기는 값의 범위만 못 박는다.
 */
export const ZodFaultCode = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
]);
export type FaultCodeValue = z.infer<typeof ZodFaultCode>;

/*
  ── BE 확정 대기 ───────────────────────────────────────────

  값을 못 받은 축은 여기 적지 않는다 — 임의 번호를 박아 두면 값이 오는 날 어느 것이 추측이었는지
  가릴 수 없다. 확정될 때까지 계약 스키마는 `z.number().int()` 로 둔다.

    stateCode            보고서 상태 — 작성중 · 제출완료 · 검토중 · 확인완료 · 반려
    reportTypeCode       정기점검 · 특별점검
    targetTypeCode       전체 · RTU · 인버터 · 모듈 어레이 · 일사량계 · 기타
    checkResultCode      점검결과 — 양호 · 미흡 · 해당없음
    sourceCode           알림 검출출처 — AI진단 · 시스템감지
    rtuStatusCode        RTU 통신상태
    irradStatusCode      일사량계 상태
    resultCode           교육부 연계 전송결과
    responseCode         교육부 연계 응답
    serverRoleCode       서버 역할
    levelCode            서버 점검 등급
    weatherCode          날씨
*/
