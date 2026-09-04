import dayjs from 'dayjs';
import type { QualityStatus } from '@/interface/diagnosisDetail';
import { QUALITY_THRESHOLD } from '@/configs/quality';
import { POINTS_PER_DAY } from './collection';
import { SCHOOLS } from './schools';
import { createRandom, hashSeed, pickNumber } from './random';
import { isProducing } from './status';

const cache = new Map<string, QualityStatus[]>();

/** 설비별·기간별 수집 품질 (SFR-012-10) — 수집된 raw 중 상태코드가 정상인 비율이다. */
export function getQualityStatus(schoolId: string | null, start: Date, end: Date): QualityStatus[] {
  const key = `${schoolId ?? 'all'}-${dayjs(start).format('YYYYMMDD')}-${dayjs(end).format('YYYYMMDD')}`;
  const cached = cache.get(key);

  if (cached) return cached;

  const days = Math.max(1, dayjs(end).diff(dayjs(start), 'day') + 1);
  const totalRows = POINTS_PER_DAY * days;
  const targets = schoolId ? SCHOOLS.filter((school) => school.id === schoolId) : SCHOOLS;

  const rows = targets.map((school) => {
    const next = createRandom(hashSeed(`${school.id}-${key}-quality`));

    // 상태가 나쁠수록 정상으로 안 찍힌 건수가 늘고, 통신이 끊겼으면 통째로 빠진다.
    const badRatio = !isProducing(school.status)
      ? 1
      : school.status === 'fault'
        ? pickNumber(next, 0.08, 0.2, 4)
        : school.status === 'degraded'
          ? pickNumber(next, 0.02, 0.06, 4)
          : pickNumber(next, 0.001, 0.012, 4);

    const validRows = totalRows - Math.round(totalRows * badRatio);

    return {
      schoolId: school.id,
      schoolName: school.name,
      regionName: school.regionName,
      status: school.status,
      totalRows,
      validRows,
      qualityRate: totalRows > 0 ? validRows / totalRows : 0,
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
  };
}
