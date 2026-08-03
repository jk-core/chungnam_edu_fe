/** 수집 채널 종류 */
export type ChannelKey = 'power' | 'irradiance' | 'dcVoltage' | 'dcCurrent' | 'moduleTemp' | 'acVoltage';

export interface Channel {
  key: ChannelKey;
  label: string;
  unit: string;
  /** 차트 선 색으로 쓸 CSS 변수 */
  color: string;
  /** 정상 범위. 벗어나면 화면에서 짚어 준다. */
  normalRange?: [number, number];
}

/** 15분 주기로 수집된 한 시점 */
export interface RawPoint {
  /** 'HH:mm' */
  time: string;
  /** 수집 실패 구간은 null */
  values: Record<ChannelKey, number | null>;
}

/** 설비별 수집 현황 */
export interface CollectionStatus {
  schoolId: string;
  schoolName: string;
  regionName: string;
  /** 0~1 */
  rate: number;
  /** 기대 수집 건수 대비 빠진 건수 */
  missing: number;
  expected: number;
  /** 마지막으로 값이 들어온 시각 */
  lastCollectedAt: string;
  /** 수집 지연(분) */
  delayMinutes: number;
}
