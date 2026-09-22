import { useMemo } from 'react';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { getDiagnosisInverterList, getDiagnosisStringList } from '@/service/diagnosis';
import { inverterNodeId, serverIdOf, stringNodeId } from '@/configs/scope';
import { operationFromCode } from '@/mocks/status';
import { queryKeys } from '@/service/queryKeys';
import { useDiagnosisRange } from '@/stores/filterStore';
import { useDiagnosisScope } from '@/hooks/useDiagnosisScope';
import type { DailySimpleEfficiency } from '@/service/diagnosis/type';
import type { DiagnosisFaultCode } from '@/interface/equipment';
import type { OperationStatus } from '@/interface/status';

/**
 * 카드·표 한 줄 — 발전소 아래 인버터, 인버터 아래 스트링이 같은 모양으로 선다.
 *
 * `power` 가 null 인 것은 「아직 안 온 값」이 아니라 **스트링에는 없는 개념**이다 —
 * 측정·기대 발전량은 인버터까지만 잰다. 그래서 화면도 그 칸을 세우지 않는다.
 */
export interface DiagnosisUnit {
  /** 트리 노드 id — 카드를 누르면 이 대상으로 조회가 옮겨 간다 */
  nodeId: string;
  name: string;
  capacityKw: number;
  status: OperationStatus;
  statusName: string;
  /** 최신일 효율 (%) */
  efficiency: number;
  /** 기준에 못 미친 날 수 */
  countBelow: number;
  faultCode: DiagnosisFaultCode;
  faultCodeName: string;
  points: DailySimpleEfficiency[];
  power: { current: number; predicted: number } | null;
}

const NONE: DiagnosisUnit[] = [];

/**
 * 지금 보고 있는 계층 바로 아래 설비의 진단 현황 (SFR-013-04/07/08).
 *
 * 대상마다 경로가 갈리므로 조회도 갈린다 — 발전소면 인버터 목록, 인버터면 스트링 목록이다.
 * 도 전체와 스트링에는 아래가 없어 조회할 것이 없다.
 */
export function useDiagnosisUnits() {
  const { target } = useDiagnosisScope();
  const [range] = useDiagnosisRange();

  const startDate = dayjs(range.start).format('YYYY-MM-DD');
  const endDate = dayjs(range.end).format('YYYY-MM-DD');
  const powerPlantId = target.kind === 'plant' ? serverIdOf(target.id, 'p') : null;
  const cid = target.kind === 'inverter' ? serverIdOf(target.id, 'i') : null;

  const plantParams = { powerPlantId: powerPlantId ?? 0, startDate, endDate };
  const inverterParams = { cid: cid ?? 0, startDate, endDate };

  const inverters = useQuery({
    queryKey: queryKeys.diagnosis.powerPlant.inverterList(plantParams),
    queryFn: () => getDiagnosisInverterList(plantParams),
    enabled: powerPlantId !== null,
  });

  const strings = useQuery({
    queryKey: queryKeys.diagnosis.inverter.stringList(inverterParams),
    queryFn: () => getDiagnosisStringList(inverterParams),
    enabled: cid !== null,
  });

  const units = useMemo<DiagnosisUnit[]>(() => {
    if (powerPlantId !== null) {
      return inverters.data?.map((row) => ({
        nodeId: inverterNodeId(row.cid),
        name: row.equipmentName,
        capacityKw: row.equipmentCapacity,
        status: operationFromCode(row.statusCode),
        statusName: row.statusName,
        efficiency: row.diagEfficiency,
        countBelow: row.countBelow,
        faultCode: row.faultCode,
        faultCodeName: row.faultCodeName,
        points: row.flowChartData,
        power: { current: row.currentPower, predicted: row.predictedPower },
      })) ?? NONE;
    }

    return strings.data?.map((row) => ({
      nodeId: stringNodeId(row.stringId),
      name: row.stringName,
      capacityKw: row.stringCapacity,
      status: operationFromCode(row.statusCode),
      statusName: row.statusName,
      // 스트링에는 최신일 효율이 따로 오지 않는다 — 시계열의 마지막 날이 그 값이다.
      efficiency: row.flowChartData[row.flowChartData.length - 1]?.efficiency ?? 0,
      countBelow: row.countBelow,
      faultCode: row.faultCode,
      faultCodeName: row.faultCodeName,
      points: row.flowChartData,
      power: null,
    })) ?? NONE;
  }, [powerPlantId, inverters.data, strings.data]);

  return {
    units,
    isLoading: inverters.isLoading || strings.isLoading,
    /** 아래로 내려갈 계층이 있는 대상인지 — 도 전체와 스트링은 여기가 비어 있다 */
    hasChildren: powerPlantId !== null || cid !== null,
    childNoun: target.kind === 'plant' ? '인버터' : '스트링',
  };
}
