import { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { buildEduStats } from '@/mocks/solarEdu';
import { formatCapacity, formatNumber } from '@/utils/format';
import { getDayWeather } from '@/mocks/weather';
import { resolveEduLevel } from '@/mocks/eduContent';
import { getNode } from '@/mocks/tree';
import { getSchoolById, SCHOOLS } from '@/mocks/schools';
import { TODAY } from '@/mocks/today';

/** 설비용량을 머리줄에 적을 때 — 자릿수가 커지면 MW 로 올린다 */
function capacityText(kw: number) {
  const { value, unit } = formatCapacity(kw);

  return `${value}${unit}`;
}

/**
 * 무엇을, 누구 눈높이로 보여 줄지 (SFR-005-04).
 *
 * 로그인 없이 들어오므로 조회 대상은 URL 의 `orgId` 로만 정한다 — 없으면 도 전체다.
 * 학교급이 곧 눈높이지만, 화면에서 고른 값(`?level=`)이 있으면 그쪽이 이긴다.
 */
export function useEduScope(nowHour: number) {
  const { orgId } = useParams<{ orgId: string }>();
  const [searchParams] = useSearchParams();

  const node = useMemo(() => getNode(orgId), [orgId]);
  const stats = useMemo(() => buildEduStats(node, nowHour), [node, nowHour]);
  const weather = useMemo(() => getDayWeather(node.plantId, TODAY.toDate()).kind, [node]);

  // 상황판은 학교마다 걸린다 — 어느 학교를 띄울지 여기서 고른다 (회의 결정).
  const plant = node.plantId ? getSchoolById(node.plantId) : null;

  /*
    보는 사람의 눈높이만 정하고 대본은 고르지 않는다.

    시안마다 읽는 대본이 다르기 때문이다 — 고등 시안 a 는 초등 대본을 읽는다. 여기서 대본까지
    정해 버리면 그 어긋남을 표현할 수 없어, 대본 고르기는 시안 격자(`EDU_CELLS`)에 맡긴다.
  */
  const level = resolveEduLevel(plant, searchParams.get('level'));

  return {
    node,
    plant,
    stats,
    weather,
    level,
    scopeInfo: plant
      ? `설비용량 ${capacityText(plant.capacityKw)} · 인버터 ${plant.inverterCount}대`
      : `관내 ${formatNumber(SCHOOLS.length)}개 학교를 합쳐서 봅니다`,
  };
}
