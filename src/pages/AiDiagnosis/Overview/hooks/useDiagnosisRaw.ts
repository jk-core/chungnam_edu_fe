import { useQuery } from '@tanstack/react-query';
import { getDiagnosisInverterRaw, getDiagnosisStringRaw } from '@/service/diagnosis';
import { queryKeys } from '@/service/queryKeys';
import { serverIdOf } from '@/configs/scope';
import type { DiagnosisRawPoint } from '@/service/diagnosis/type';

const NONE: DiagnosisRawPoint[] = [];

/**
 * 수집 raw data — 전력·전압·전류 추이와 정상범위 상·하한 (SFR-013-09/10).
 *
 * 인버터와 스트링에서만 나오는 값이다. 기간을 인자로 받는 것은 기간 추이와 하루짜리
 * 심층 진단이 같은 계약을 쓰기 때문이다 — 하루만 볼 때는 시작일과 끝일을 같게 준다.
 */
export function useDiagnosisRaw(nodeId: string | null, startDate: string, endDate: string) {
  const cid = nodeId ? serverIdOf(nodeId, 'i') : null;
  const stringId = nodeId ? serverIdOf(nodeId, 's') : null;

  const inverterParams = { cid: cid ?? 0, startDate, endDate };
  const stringParams = { stringId: stringId ?? 0, startDate, endDate };

  const inverter = useQuery({
    queryKey: queryKeys.diagnosis.inverter.raw(inverterParams),
    queryFn: () => getDiagnosisInverterRaw(inverterParams),
    enabled: cid !== null,
  });

  const string = useQuery({
    queryKey: queryKeys.diagnosis.string.raw(stringParams),
    queryFn: () => getDiagnosisStringRaw(stringParams),
    enabled: stringId !== null,
  });

  const data = cid !== null ? inverter.data : string.data;

  return {
    name: inverter.data?.equipmentName ?? string.data?.stringName ?? '',
    points: data?.list ?? NONE,
    /** 정상범위를 벗어난 일수 */
    outOfRangeDays: data?.outOfRangeDays ?? 0,
    isLoading: inverter.isLoading || string.isLoading,
    /** 계측 추이가 나오는 계층인지 — 발전소 이상에는 그릴 것이 없다 */
    supported: cid !== null || stringId !== null,
  };
}
