import { EDU_VARIANT_LABEL } from '@/components/solar-edu/variants/EduBoard';
import { HeadlineStrip } from '@/components/solar-edu/HeadlineStrip';
import { SkyBackdrop } from '@/components/solar-edu/SkyBackdrop';
import { SolarEduLayout } from '@/layouts/SolarEduLayout';
import { useAutoPager } from '@/hooks/useAutoPager';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import type { EduVariant } from '@/components/solar-edu/variants/EduBoard';
import { useEduClock } from '../hooks/useEduClock';
import { useEduScope } from '../hooks/useEduScope';
import { EduStage } from './EduStage';
import { LevelPicker } from './LevelPicker';
import { SchoolPicker } from './SchoolPicker';

/** 계측값을 다시 읽는 주기 (SFR-005-09) */
const REFRESH_MS = 60_000;

/** 티커 문구를 바꾸는 주기 */
const FACT_MS = 11_000;

/** 화면 한 벌을 세운다 — 머리줄·고르개·본문이 모두 같은 조회 대상과 같은 시각을 본다. */
export function SolarEduScreen({ variant }: { variant?: EduVariant }) {
  // 화면을 주기적으로 되그린다. 실제 API 로 바뀌면 이 틱이 재조회 시점이 된다 (SFR-005-09).
  useAutoRefresh(REFRESH_MS);

  const { clock, date, nowHour } = useEduClock();
  const { node, plant, stats, weather, content, scopeInfo } = useEduScope(nowHour);

  // 세 판은 본문 구성 자체가 갈린다 — 하늘을 까는 것은 그림이 주인공인 초등 판뿐이다.
  const isKid = content.level === 'elementary';

  /*
    아래를 도는 "알고 계셨나요" 한 줄. 초등 판에는 두지 않는다 —
    본문이 이미 걸음마다 큰 글씨 한 줄을 바꿔 달고 있어, 읽을 곳이 둘이 되면 오히려 산만하다.

    한 줄씩 넘기는 것도 쪽 넘김이라 관제 화면과 같은 장치를 쓴다. 문구 수가 눈높이마다 달라
    총 수를 여기에 매어 둬야 인덱스가 범위를 벗어나지 않는다.
  */
  const facts = isKid ? [] : content.facts;
  const fact = useAutoPager({ total: facts.length, perPage: 1, intervalMs: FACT_MS });

  return (
    <SolarEduLayout
      scopeLabel={node.fullName}
      variantLabel={variant ? EDU_VARIANT_LABEL[variant][content.level] : undefined}
      scopeInfo={scopeInfo}
      scopePicker={<SchoolPicker plantId={plant?.id ?? null} variant={variant} />}
      backdrop={isKid ? <SkyBackdrop nowHour={nowHour} /> : undefined}
      levelPicker={<LevelPicker />}
      weather={weather}
      isLive={stats.isLive}
      clock={clock}
      date={date}
      headline={<HeadlineStrip stats={stats} content={content.headline} large={content.emphasis === 'large'} />}
      facts={facts}
      factIndex={fact.page}
      onSelectFact={fact.goTo}
    >
      <EduStage
        variant={variant}
        scopeLabel={node.fullName}
        stats={stats}
        content={content}
        nowHour={nowHour}
      />
    </SolarEduLayout>
  );
}
