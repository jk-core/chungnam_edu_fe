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

  // 네 판은 본문 구성 자체가 갈린다 — 하늘을 까는 것은 그림이 주인공인 유치원·초등 판이다.
  const isKid = content.level === 'kinder' || content.level === 'elementary';

  /*
    아래를 도는 "알고 계셨나요" 한 줄. 유치원·초등 판에는 두지 않는다 —
    초등은 본문이 이미 걸음마다 큰 글씨 한 줄을 바꿔 달고 있어 읽을 곳이 둘이 되면 산만해지고,
    유치원은 아예 읽지 못한다.

    한 줄씩 넘기는 것도 쪽 넘김이라 관제 화면과 같은 장치를 쓴다. 문구 수가 눈높이마다 달라
    총 수를 여기에 매어 둬야 인덱스가 범위를 벗어나지 않는다.
  */
  const facts = content.level === 'middle' || content.level === 'high' ? content.facts : [];
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
      headline={
        /*
          위쪽 수치 띠. 유치원 판만 달지 않는다 (SFR-005-04).

          이 띠는 지표 다섯에 설명 한 줄씩이 붙은 글 덩어리라 1080 높이에서 300px 넘게 쓴다.
          글을 못 읽는 눈높이에서는 그 자리가 통째로 회색 띠로 남을 뿐이고, 떼어 내면 그만큼을
          그림이 물려받아 화면 전체가 한 장면이 된다.

          「지금 얼마나 만들고 있는가」(SFR-005-01)는 사라지지 않는다 — 유치원 판이 그것을
          본문 안에서 켜진 전구의 개수로 말한다.
        */
        content.level === 'kinder'
          ? undefined
          : <HeadlineStrip stats={stats} content={content.headline} large={content.emphasis === 'large'} />
      }
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
