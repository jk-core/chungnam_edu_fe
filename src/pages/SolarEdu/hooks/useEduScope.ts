import { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { buildEduStats } from '@/mocks/solarEdu';
import { formatCapacity, formatNumber } from '@/utils/format';
import { getDayWeather, getWeekWeather } from '@/mocks/weather';
import { resolveEduLevel } from '@/mocks/eduContent';
import { getNode } from '@/mocks/tree';
import { getSchoolById, SCHOOLS } from '@/mocks/schools';
import { TODAY } from '@/mocks/today';
import { resolveForcedWeather } from '../components/WeatherPicker';

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
  /*
    날씨는 배경과 기상 칸이 함께 쓴다.

    전에는 종류(`kind`)만 냈는데, 기온·습도와 이레치 예보가 붙으면서 한 벌을 통째로 넘긴다 —
    배경이 보는 날씨와 칸에 적히는 날씨가 갈리면 화면이 스스로를 부정한다.

    `?weather=` 가 실려 있으면 오늘치만 그 날씨로 바꿔 낸다 (시연용 · 2026-09-07 지시).
    이레 예보는 그대로 둔다 — 오늘 하루를 바꿔 보는 것이지 다음 주까지 비가 오는 것은 아니다.
  */
  const forcedKind = resolveForcedWeather(searchParams.get('weather'));
  const weather = useMemo(
    () => getDayWeather(node.plantId, TODAY.toDate(), forcedKind),
    [node, forcedKind],
  );
  const forecast = useMemo(() => getWeekWeather(node.plantId, TODAY.toDate()), [node]);

  // 상황판은 학교마다 걸린다 — 어느 학교를 띄울지 여기서 고른다 (회의 결정).
  const plant = node.plantId ? getSchoolById(node.plantId) : null;

  /*
    보는 사람의 눈높이만 정하고 대본은 고르지 않는다.

    시안마다 읽는 대본이 다르기 때문이다 — 중등 시안 b·c 는 초등 대본을 읽는다. 여기서 대본까지
    정해 버리면 그 어긋남을 표현할 수 없어, 대본 고르기는 시안 격자(`EDU_CELLS`)에 맡긴다.
  */
  const level = resolveEduLevel(plant, searchParams.get('level'));

  return {
    node,
    plant,
    stats,
    weather,
    forecast,
    level,
    scopeInfo: plant
      ? `설비용량 ${capacityText(plant.capacityKw)} · 인버터 ${plant.inverterCount}대`
      : `관내 ${formatNumber(SCHOOLS.length)}개 학교를 합쳐서 봅니다`,
  };
}
