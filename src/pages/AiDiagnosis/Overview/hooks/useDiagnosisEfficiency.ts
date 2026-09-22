import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { getDiagnosisInverterEfficiency, getDiagnosisPowerPlantEfficiency } from '@/service/diagnosis';
import { inverterNodeId, serverIdOf, stringNodeId } from '@/configs/scope';
import { formatNumber } from '@/utils/format';
import { operationFromCode } from '@/mocks/status';
import { queryKeys } from '@/service/queryKeys';
import { useDiagnosisRange } from '@/stores/filterStore';
import { useDiagnosisScope } from '@/hooks/useDiagnosisScope';
import type { StringEfficiency } from '@/service/diagnosis/type';
import type { DailyEfficiencyCell, DailyEfficiencyRow } from '../components/DailyEfficiencyTable';

const NONE: DailyEfficiencyRow[] = [];

/**
 * 일자별 발전효율 (SFR-013-02/06).
 *
 * 발전소를 보고 있으면 인버터 한 대와 **그 아래 스트링까지 한 번에** 온다 — 표에서 줄을
 * 펼치면 나오는 하위 줄이 그것이라, 펼칠 때 따로 부르지 않는다.
 * 인버터를 보고 있으면 스트링 줄만 온다.
 */
export function useDiagnosisEfficiency() {
  const { target } = useDiagnosisScope();
  const [range] = useDiagnosisRange();

  const startDate = dayjs(range.start).format('YYYY-MM-DD');
  const endDate = dayjs(range.end).format('YYYY-MM-DD');
  const powerPlantId = target.kind === 'plant' ? serverIdOf(target.id, 'p') : null;
  const cid = target.kind === 'inverter' ? serverIdOf(target.id, 'i') : null;

  const plantParams = { powerPlantId: powerPlantId ?? 0, startDate, endDate };
  const inverterParams = { cid: cid ?? 0, startDate, endDate };

  const plant = useQuery({
    queryKey: queryKeys.diagnosis.powerPlant.efficiency(plantParams),
    queryFn: () => getDiagnosisPowerPlantEfficiency(plantParams),
    enabled: powerPlantId !== null,
  });

  const inverter = useQuery({
    queryKey: queryKeys.diagnosis.inverter.stringEfficiency(inverterParams),
    queryFn: () => getDiagnosisInverterEfficiency(inverterParams),
    enabled: cid !== null,
  });

  /*
    가로축은 조회 기간이 정한다 — 응답은 계측이 있는 날만 주므로, 줄마다 온 날짜 수가
    다르면 칸이 밀려 다른 날의 값을 그 날 것으로 읽게 된다.
  */
  const dates = useMemo(() => {
    const days = Math.max(1, dayjs(endDate).diff(dayjs(startDate), 'day') + 1);

    return Array.from({ length: days }, (_, index) => dayjs(startDate).add(index, 'day').format('YYYY-MM-DD'));
  }, [startDate, endDate]);

  const rows = useMemo<DailyEfficiencyRow[]>(() => {
    if (powerPlantId !== null) {
      return plant.data?.map((row) => ({
        id: inverterNodeId(row.cid),
        name: row.equipmentName,
        status: operationFromCode(row.statusCode),
        meta: row.stringList.length > 0
          ? `${formatNumber(row.equipmentCapacity, 1)} kW · 하위 ${row.stringList.length}`
          : `${formatNumber(row.equipmentCapacity, 1)} kW`,
        // 발전소 조회에서만 효율 칸 이름이 `diagEfficiency` 다.
        points: alignToDates(dates, row.dailyList.map((day) => ({
          date: day.dateTime,
          efficiency: day.diagEfficiency ?? 0,
          faultCode: day.faultCode ?? 0,
          faultCodeName: day.faultCodeName ?? '',
        }))),
        children: row.stringList.map((item) => toStringRow(item, dates)),
      })) ?? NONE;
    }

    return inverter.data?.map((row) => toStringRow(row, dates)) ?? NONE;
  }, [powerPlantId, plant.data, inverter.data, dates]);

  return {
    rows,
    dates,
    isLoading: plant.isLoading || inverter.isLoading,
    /** 아래로 내려갈 계층이 있는 대상인지 */
    hasChildren: powerPlantId !== null || cid !== null,
    unitNoun: target.kind === 'plant' ? '인버터' : '스트링',
  };
}

function toStringRow(row: StringEfficiency, dates: string[]): DailyEfficiencyRow {
  return {
    id: stringNodeId(row.stringId),
    name: row.stringName,
    status: operationFromCode(row.statusCode),
    meta: `${formatNumber(row.stringCapacity, 1)} kW`,
    points: alignToDates(dates, row.dailyList.map((day) => ({
      date: day.dateTime,
      efficiency: day.efficiency ?? 0,
      faultCode: day.faultCode ?? 0,
      faultCodeName: day.faultCodeName ?? '',
    }))),
  };
}

/** 계측이 없는 날은 효율 0 으로 채운다 — 표가 그 칸을 「계측 없음」으로 비운다 */
function alignToDates(dates: string[], points: DailyEfficiencyCell[]): DailyEfficiencyCell[] {
  const byDate = new Map(points.map((point) => [point.date, point]));

  return dates.map((date) => byDate.get(date) ?? { date, efficiency: 0, faultCode: 0, faultCodeName: '' });
}
