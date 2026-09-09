import { EDU_CELLS } from '@/components/solar-edu/variants/EduBoard';
import { EDU_CONTENT, headlineFor } from '@/mocks/eduContent';
import { EduBoard } from '@/components/solar-edu/variants/EduBoard';
import { HeadlineStrip } from '@/components/solar-edu/HeadlineStrip';
import { PaperBoard } from '@/components/solar-edu/variants/middle/paper/PaperBoard';
import { SkyBackdrop } from '@/components/solar-edu/SkyBackdrop';
import { SolarEduLayout } from '@/layouts/SolarEduLayout';
import { useAutoPager } from '@/hooks/useAutoPager';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import type { EduVariant } from '@/components/solar-edu/variants/EduBoard';
import { useEduClock } from '../hooks/useEduClock';
import { useEduScope } from '../hooks/useEduScope';
import { LevelPicker } from './LevelPicker';
import { WeatherPicker } from './WeatherPicker';
import { SchoolPicker } from './SchoolPicker';

/** 계측값을 다시 읽는 주기 (SFR-005-09) */
const REFRESH_MS = 60_000;

/** 티커 문구를 바꾸는 주기 */
const FACT_MS = 11_000;

/**
 * 화면 한 벌을 세운다 — 머리줄·고르개·본문이 모두 같은 조회 대상과 같은 시각을 본다.
 *
 * 무엇을 보여 줄지는 눈높이와 시안이 함께 정하고, 그 조합의 성격은 `EDU_CELLS` 한 곳에 적혀 있다.
 * 여기서는 그 표를 읽어 껍데기를 맞출 뿐이라, 시안이 늘거나 줄어도 이 파일은 그대로다.
 */
export function SolarEduScreen({ variant }: { variant: EduVariant }) {
  // 화면을 주기적으로 되그린다. 실제 API 로 바뀌면 이 틱이 재조회 시점이 된다 (SFR-005-09).
  useAutoRefresh(REFRESH_MS);

  const { clock, date, nowHour } = useEduClock();
  const { node, plant, stats, weather, forecast, level, scopeInfo } = useEduScope(nowHour);

  const cell = EDU_CELLS[level][variant];

  /*
    껍데기가 읽을 대본. 본문과 같은 것을 봐야 한다 —
    본문은 쉬운 말인데 위 다섯 줄만 어려운 화면이 되지 않게 칸이 정한 대본을 그대로 따른다.
  */
  const script = EDU_CONTENT[cell.script];

  /*
    아래를 도는 "알고 계셨나요" 한 줄.

    그림이 본문인 칸에는 두지 않는다 — 그런 칸은 이미 걸음마다 큰 글씨 한 줄을 바꿔 달고 있어
    화면 아래에서 또 다른 글이 돌면 읽을 곳이 둘이 된다. 초등 대본은 이 문구를 아예 갖고 있지 않다.

    한 줄씩 넘기는 것도 쪽 넘김이라 관제 화면과 같은 장치를 쓴다. 문구 수가 대본마다 달라
    총 수를 여기에 매어 둬야 인덱스가 범위를 벗어나지 않는다.
  */
  const facts = cell.facts && script.level !== 'elementary' ? script.facts : [];
  const fact = useAutoPager({ total: facts.length, perPage: 1, intervalMs: FACT_MS });

  /*
    완전히 멎었을 때 띄우는 한 줄 (SFR-005-10).

    「~가 아파요」 같은 말은 정말 멎었을 때만 쓴다 (2026-09-04 회의). 임계값으로 고장을 가리면
    상시 걸리는데, 상시 걸리는 경고는 아무도 보지 않는다.
  */
  const stoppedNote = stats.isStopped
    ? script.level === 'elementary'
      ? '태양광이 아파요. 지금은 전기를 만들지 못하고 있어요.'
      : '해는 떠 있는데 발전이 멈췄습니다. 설비 점검이 필요합니다.'
    : undefined;

  const scopePicker = <SchoolPicker plantId={plant?.id ?? null} variant={variant} />;

  /*
    골격까지 제 것을 세우는 칸은 여기서 갈라져 나간다.

    공용 껍데기에 끼우면 그 판의 첫 장과 위쪽 요약 띠가 같은 값을 두 번 말한다.
    조회 대상·시각·눈높이를 정하는 방식은 다른 칸과 똑같다 — 시안이 갈리는 것은
    **보여 주는 방식**이지 무엇을 보는지가 아니기 때문이다.
  */
  if (cell.standalone) {
    return (
      <PaperBoard
        level={cell.script}
        variantLabel={cell.label}
        scopeLabel={node.fullName}
        scopeInfo={scopeInfo}
        stats={stats}
        weather={weather}
        forecast={forecast}
        clock={clock}
        date={date}
        nowHour={nowHour}
        isLive={stats.isLive}
        scopePicker={scopePicker}
        levelPicker={(
          <>
            <LevelPicker />
            {/* 시연용 임시 고르개 — 실제 기상 연동이 붙으면 걷는다 */}
            <WeatherPicker />
          </>
        )}
      />
    );
  }

  return (
    <SolarEduLayout
      scopeLabel={node.fullName}
      variantLabel={cell.label}
      scopeInfo={scopeInfo}
      scopePicker={scopePicker}
      /*
        하늘은 어느 칸에나 깐다 (2026-09-04 지시).

        한때 그림이 주인공인 칸에만 깔았다 — 값이 주인공인 칸에서는 배경이 숫자를 흐린다고 보았다.
        그런데 눈높이를 오갈 때마다 배경이 있었다 없었다 해서 같은 학교의 화면이 서로 다른 곳처럼
        보였다. 카드가 화면을 덮고 있어 숫자가 흐려지지도 않는다.
      */
      backdrop={<SkyBackdrop nowHour={nowHour} kind={weather.kind} />}
      levelPicker={(
        <>
          <LevelPicker />
          {/* 시연용 임시 고르개 — 실제 기상 연동이 붙으면 걷는다 */}
          <WeatherPicker />
        </>
      )}
      weather={weather.kind}
      isLive={stats.isLive}
      stoppedNote={stoppedNote}
      clock={clock}
      date={date}
      headline={
        cell.headline
          ? <HeadlineStrip stats={stats} content={headlineFor(script.headline, level)} large={script.emphasis === 'large'} />
          : undefined
      }
      facts={facts}
      factIndex={fact.page}
      factMs={FACT_MS}
      onSelectFact={fact.goTo}
    >
      <EduBoard
        level={level}
        variant={variant}
        scopeLabel={node.fullName}
        stats={stats}
        nowHour={nowHour}
        today={weather}
        forecast={forecast}
      />
    </SolarEduLayout>
  );
}
