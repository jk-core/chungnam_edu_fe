import { PaperBoard } from '@/components/solar-edu/variants/e/PaperBoard';
import { TODAY } from '@/mocks/today';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { useEduClock } from '../hooks/useEduClock';
import { useEduScope } from '../hooks/useEduScope';
import { LevelPicker } from './LevelPicker';
import { SchoolPicker } from './SchoolPicker';

/** 계측값을 다시 읽는 주기 (SFR-005-09) */
const REFRESH_MS = 60_000;

/**
 * 시안 E 한 벌 (SFR-005).
 *
 * 다른 시안은 `SolarEduScreen` 이 공용 레이아웃에 본문을 끼우지만, 이 판은 골격까지
 * 자기 것을 쓴다. 그래서 화면 조립도 따로 둔다 — 한 화면에서 두 골격을 갈라 쓰면
 * 쓰지 않는 쪽의 값과 손잡이가 계속 따라다닌다.
 *
 * 조회 대상·시각·눈높이를 정하는 방식은 다른 시안과 똑같다. 시안이 갈리는 것은
 * **보여 주는 방식**이지 무엇을 보는지가 아니기 때문이다.
 */
export function SolarEduPaper() {
  useAutoRefresh(REFRESH_MS);

  const { clock, date, nowHour } = useEduClock();
  const { node, plant, stats, weather, content, scopeInfo } = useEduScope(nowHour);

  return (
    <PaperBoard
      level={content.level}
      scopeLabel={node.fullName}
      scopeInfo={scopeInfo}
      stats={stats}
      weather={weather}
      // 판의 온도가 계절을 타므로 4장이 달을 본다. 날씨와 같은 날을 봐야 하므로 목업 기준일에서 꺼낸다.
      month={TODAY.toDate().getMonth()}
      clock={clock}
      date={date}
      nowHour={nowHour}
      isLive={stats.isLive}
      scopePicker={<SchoolPicker plantId={plant?.id ?? null} variant="e" />}
      levelPicker={<LevelPicker />}
    />
  );
}
