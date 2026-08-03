import dayjs from 'dayjs';
import type { QualityCode, QualityStatus } from '@/interface/diagnosisDetail';
import type { Severity } from '@/interface/status';
import { POINTS_PER_DAY } from './collection';
import { SCHOOLS } from './schools';
import { createRandom, hashSeed, pickNumber } from './random';
import { isProducing } from './status';

/**
 * 수집 데이터 상태 코드 (SFR-003-05~08).
 * 정합성 검증에서 걸러진 이유를 코드로 남겨, 어떤 유형이 잦은지 볼 수 있게 한다.
 */
export const QUALITY_META: Record<QualityCode, { label: string; severity: Severity; detail: string }> = {
  ok: { label: '정상', severity: 'info', detail: '검증을 모두 통과했습니다.' },
  missing: { label: '결측', severity: 'critical', detail: '해당 시각 값이 들어오지 않았습니다.' },
  zero: { label: '0 값', severity: 'caution', detail: '발전 시간대인데 누적 발전량이 0 입니다.' },
  negative: { label: '음수', severity: 'critical', detail: '누적값에 음수가 들어왔습니다.' },
  overLimit: { label: '한계 초과', severity: 'critical', detail: '설비용량으로 낼 수 없는 값입니다.' },
  reversed: { label: '누적값 역전', severity: 'critical', detail: '앞 시점보다 누적값이 줄었습니다.' },
  corrLow: { label: '상관 이상', severity: 'caution', detail: '일사량과 발전량의 상관이 허용 오차를 넘었습니다.' },
};

export const QUALITY_CODES = Object.keys(QUALITY_META) as QualityCode[];

/** 품질 기준 — 이 아래면 AI 학습에서 뺀다 (SFR-012-11) */
export const QUALITY_THRESHOLD = 0.95;

const emptyByCode = (): Record<QualityCode, number> => ({
  ok: 0,
  missing: 0,
  zero: 0,
  negative: 0,
  overLimit: 0,
  reversed: 0,
  corrLow: 0,
});

const cache = new Map<string, QualityStatus[]>();

/** 설비별·기간별 수집 품질 (SFR-012-10) */
export function getQualityStatus(schoolId: string | null, start: Date, end: Date): QualityStatus[] {
  const key = `${schoolId ?? 'all'}-${dayjs(start).format('YYYYMMDD')}-${dayjs(end).format('YYYYMMDD')}`;
  const cached = cache.get(key);

  if (cached) return cached;

  const days = Math.max(1, dayjs(end).diff(dayjs(start), 'day') + 1);
  const targets = schoolId ? SCHOOLS.filter((school) => school.id === schoolId) : SCHOOLS;

  const rows = targets.map((school) => {
    const next = createRandom(hashSeed(`${school.id}-${key}-quality`));
    const totalRows = POINTS_PER_DAY * days;
    const byCode = emptyByCode();
    const live = isProducing(school.status);

    // 상태가 나쁠수록 걸러지는 건수가 늘어난다.
    const badRatio = !live
      ? 1
      : school.status === 'fault'
        ? pickNumber(next, 0.08, 0.2, 4)
        : school.status === 'degraded'
          ? pickNumber(next, 0.02, 0.06, 4)
          : pickNumber(next, 0.001, 0.012, 4);

    const badRows = Math.round(totalRows * badRatio);

    // 통신이 끊긴 설비는 통째로 결측이고, 그 밖에는 유형이 섞인다.
    if (!live) {
      byCode.missing = badRows;
    } else {
      byCode.missing = Math.round(badRows * 0.42);
      byCode.zero = Math.round(badRows * 0.18);
      byCode.corrLow = Math.round(badRows * 0.16);
      byCode.overLimit = Math.round(badRows * 0.12);
      byCode.reversed = Math.round(badRows * 0.08);
      byCode.negative = badRows - byCode.missing - byCode.zero - byCode.corrLow - byCode.overLimit - byCode.reversed;
    }

    const validRows = totalRows - badRows;
    const qualityRate = totalRows > 0 ? validRows / totalRows : 0;

    return {
      schoolId: school.id,
      schoolName: school.name,
      regionName: school.regionName,
      status: school.status,
      totalRows,
      validRows,
      qualityRate,
      byCode: { ...byCode, ok: validRows },
      excludedFromTraining: qualityRate < QUALITY_THRESHOLD ? badRows : 0,
    };
  }).sort((a, b) => a.qualityRate - b.qualityRate);

  cache.set(key, rows);

  return rows;
}

/** 기간 전체 요약 */
export function summarizeQuality(rows: QualityStatus[]) {
  const total = rows.reduce((sum, row) => sum + row.totalRows, 0);
  const valid = rows.reduce((sum, row) => sum + row.validRows, 0);

  return {
    plantCount: rows.length,
    totalRows: total,
    validRows: valid,
    qualityRate: total > 0 ? valid / total : 0,
    belowThreshold: rows.filter((row) => row.qualityRate < QUALITY_THRESHOLD).length,
    excludedRows: rows.reduce((sum, row) => sum + row.excludedFromTraining, 0),
  };
}
