import { useMemo, useState } from 'react';
import { getCollectionStatus } from '@/mocks/collection';
import { getQualityStatus, summarizeQuality } from '@/mocks/quality';
import { getNode, ROOT_ID } from '@/mocks/tree';
import { getNodeStat } from '@/mocks/nodeStats';
import { liveTotalOutput } from '@/mocks/schoolOutput';
import { NOW, TODAY } from '@/mocks/today';
import { isAbnormal, OPERATION_LABEL } from '@/mocks/status';
import { formatNumber } from '@/utils/format';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { ALERT_RECORDS } from '@/mocks/alerts';
import { CHUNGNAM_REGIONS } from '@/configs/regions';
import { ALL, EMPTY_FILTERS, matchPlants } from '@/components/plant/PlantSearchModal';
import type { PlantFilters } from '@/components/plant/PlantSearchModal';
import type { AlertRecord } from '@/interface/alert';
import type { CollectionStatus } from '@/interface/collection';
import type { OperationStatus } from '@/interface/status';
import type { School } from '@/interface/energy';

/** 자동 갱신 주기 — 실제 서비스에서는 이 틱에 최신 수집값을 다시 읽는다. */
const REFRESH_MS = 60_000;

/** 이 화면이 다루는 범위 — 늘 도 전체다 */
export const SCOPE_LABEL = '충청남도 전체';

/** 화면 가장자리를 점등하는 결 (SFR-004-14) */
export type AlertTone = 'critical' | 'caution' | 'offline';

/**
 * 화면 가장자리를 어느 색으로 점등할지 (SFR-004-14).
 * 통신 장애는 설비 고장과 원인이 달라 갈라 놓는다.
 */
export function toneOfAlert(alert: AlertRecord): AlertTone {
  if (alert.status === 'commLost') return 'offline';

  return alert.status === 'fault' ? 'critical' : 'caution';
}

export interface ControlRoomData {
  filters: PlantFilters;
  setFilters: (filters: PlantFilters) => void;
  /** 조건에 걸린 발전소 — 조건이 없으면 전체다 */
  rows: School[];
  plantIds: Set<string>;
  collection: {
    rows: CollectionStatus[];
    byId: Map<string, CollectionStatus>;
    stale: CollectionStatus[];
    latest: string;
  };
  /** 수집 품질이 기준(95%)에 못 미친 개소 */
  belowThreshold: number;
  totals: {
    outputKw: number;
    capacityKw: number;
    todayKwh: number;
    monthKwh: number;
    yearKwh: number;
  };
  /** 등가 발전시간을 포함한 도 전체 집계 */
  stat: ReturnType<typeof getNodeStat>;
  abnormalCount: number;
  /** 아직 손대지 않은 경보 — 최근 순 */
  openAlerts: AlertRecord[];
  /** 가장 급한 결 하나. 없으면 null */
  alertTone: AlertTone | null;
  /** 무엇으로 좁혀 놓았는지 한 줄 요약. 조건이 없으면 undefined */
  searchSummary?: string;
}

/**
 * 통합관제 상황판이 보는 값 한 벌 (SFR-004).
 *
 * 시안이 여럿이라 값을 각자 조립하면 같은 화면을 견줄 수 없다 — 어느 쪽이 더 잘 읽히는지를
 * 가리려는데 숫자가 다르면 그것부터 눈에 걸린다. 그래서 조립은 여기 한 곳에서만 하고,
 * 시안은 **같은 값을 어떻게 늘어놓을지**만 달리한다.
 */
export function useControlRoomData(): ControlRoomData {
  useAutoRefresh(REFRESH_MS);

  // 조회 조건 (SFR-004-11/12) — 헤더 검색창에서 연다.
  const [filters, setFilters] = useState<PlantFilters>(EMPTY_FILTERS);

  // 수집 현황은 최근 수집 시각·미수신 표시에 쓴다 (SFR-004-04/05).
  const collection = useMemo(() => {
    const rows = getCollectionStatus(NOW.toDate());
    const stale = rows.filter((row) => row.delayMinutes > 60);
    const latest = rows.reduce((best, row) => (row.lastCollectedAt > best ? row.lastCollectedAt : best), '');

    return { rows, byId: new Map(rows.map((row) => [row.schoolId, row])), stale, latest };
  }, []);

  // 수집 품질이 기준(95%)에 못 미치는 개소 (SFR-012-10).
  const quality = useMemo(
    () => summarizeQuality(getQualityStatus(null, TODAY.toDate(), TODAY.toDate())),
    [],
  );

  // 조건에 걸린 발전소를 이상부터 세운다 (SFR-004-13). 조건이 없으면 전체가 대상이다.
  const rows = useMemo(() => matchPlants(filters), [filters]);
  const plantIds = useMemo(() => new Set(rows.map((row) => row.id)), [rows]);

  /** 검색창에 되짚어 줄 조건 요약 — 무엇으로 좁혀 놓았는지 한 줄로 적는다. */
  const searchSummary = useMemo(() => {
    const chips = [
      filters.keyword.trim() ? `"${filters.keyword.trim()}"` : null,
      filters.region !== ALL ? CHUNGNAM_REGIONS.find((item) => item.code === filters.region)?.name ?? null : null,
      filters.level !== ALL ? filters.level : null,
      filters.status !== ALL ? OPERATION_LABEL[filters.status as OperationStatus] : null,
    ].filter((chip): chip is string => Boolean(chip));

    if (chips.length === 0) return undefined;

    return `${chips.join(' · ')} · ${formatNumber(rows.length)}개소`;
  }, [filters, rows.length]);

  const totals = useMemo(() => ({
    outputKw: liveTotalOutput(rows),
    capacityKw: rows.reduce((sum, school) => sum + school.capacityKw, 0),
    todayKwh: rows.reduce((sum, school) => sum + school.todayKwh, 0),
    monthKwh: rows.reduce((sum, school) => sum + school.monthKwh, 0),
    yearKwh: rows.reduce((sum, school) => sum + school.yearKwh, 0),
  }), [rows]);

  const stat = useMemo(() => getNodeStat(getNode(ROOT_ID), 'day', TODAY.toDate()), []);
  const abnormalCount = useMemo(() => rows.filter((school) => isAbnormal(school.status)).length, [rows]);

  /*
    아직 손대지 않은 경보. 조치하기 전에는 사라지지 않으므로 알림창과 테두리 등이 함께 본다.
    정상 알림은 지켜보는 사람을 부르는 성격이 아니라 뺀다.
  */
  const openAlerts = useMemo(() => ALERT_RECORDS
    .filter((alert) => !alert.handled && !alert.resolvedAt && isAbnormal(alert.status))
    .sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : -1)), []);

  // 테두리는 가장 급한 결 하나만 따른다. 여러 색이 겹치면 무엇이 급한지 흐려진다.
  const alertTone: AlertTone | null = openAlerts.some((alert) => toneOfAlert(alert) === 'critical')
    ? 'critical'
    : openAlerts.some((alert) => toneOfAlert(alert) === 'caution')
      ? 'caution'
      : openAlerts.length > 0 ? 'offline' : null;

  return {
    filters,
    setFilters,
    rows,
    plantIds,
    collection,
    belowThreshold: quality.belowThreshold,
    totals,
    stat,
    abnormalCount,
    openAlerts,
    alertTone,
    searchSummary,
  };
}
