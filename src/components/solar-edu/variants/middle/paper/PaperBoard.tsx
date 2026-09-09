import { CHAPTER_IDS, CHAPTER_MARK, type ChapterId, PAPER_SCRIPT } from '@/mocks/eduPaper';
import type { EduLevel } from '@/interface/edu';
import type { EduStats } from '@/mocks/solarEdu';
import type { DayWeather } from '@/interface/weather';
import { WEATHER_META } from '@/mocks/weather';
import { WeatherPanel } from '@/components/solar-edu/WeatherPanel';
import { useAutoPager } from '@/hooks/useAutoPager';
import { useRootClass } from '@/hooks/useRootClass';
import { ChapterCarbon } from './ChapterCarbon';
import { ChapterPrinciple } from './ChapterPrinciple';
import { ChapterSummary } from './ChapterSummary';
import { PaperBackdrop } from './PaperBackdrop';
import { ChapterGlyph } from './PaperGlyphs';
import styles from './PaperBoard.module.scss';
import type { ReactNode } from 'react';

/**
 * 한 장이 머무는 시간.
 *
 * 읽는 속도가 눈높이마다 다르다 — 초등은 글이 크고 적어도 한 줄을 짚어 가며 읽으므로 길게 둔다.
 *
 * 중등을 한 차례 늘렸다 (2026-09-04 회의). 복도에서 지나가며 보는 화면이라 한 장을 다 읽기 전에
 * 넘어간다는 지적이 있었다 — 읽는 속도가 아니라 **머무는 시간**이 모자란 것이다.
 *
 * 고등을 13초에서 늘렸다 (2026-09-09). 빨리 훑는 눈높이라고 짧게 잡아 둔 값인데, 정작 이 판에는
 * 1장에 두 줄과 3장에 근거 한 줄이 더 붙어 **읽을 것은 중등보다 많다.** 중등과 같은 지적을 받는다.
 */
const CHAPTER_MS: Record<EduLevel, number> = {
  elementary: 21_000,
  middle: 22_000,
  high: 20_000,
};

interface PaperBoardProps {
  level: EduLevel;
  /** 회의에서 부르는 이름 — 골격을 스스로 세우는 판이라 이름표도 여기서 그린다 */
  variantLabel: string;
  scopeLabel: string;
  scopeInfo: string;
  stats: EduStats;
  weather: DayWeather;
  /** 오늘부터 이레치 */
  forecast: DayWeather[];
  clock: string;
  date: string;
  /** 지금 몇 시인지 (소수 시간). 배경의 해가 앉는 자리를 정한다. */
  nowHour: number;
  isLive: boolean;
  scopePicker: ReactNode;
  levelPicker: ReactNode;
}

/**
 * 「세 개의 질문」 — 중등 시안 a (SFR-005).
 *
 * 다른 시안이 지표를 칸에 늘어놓는 데 견줘, 이 판은 **묻고 답하는 지면**이다.
 * 그래서 골격도 공용 레이아웃을 쓰지 않고 여기서 통째로 세운다 — 위에 요약 띠를 두면
 * 1장이 그 띠를 한 번 더 말하는 꼴이 되고, 카드 격자가 한 번이라도 끼면 다른 시안과
 * 같은 화면이 된다.
 *
 * 왼쪽 궤도가 세 장의 차례를 쥐고, 오른쪽 지면이 지금 장을 편다. 벽걸이 화면에서는
 * 한 장이 화면을 가득 채우고 스스로 넘어가며, 좁은 화면에서는 세 장이 이어진 긴 지면이 된다 —
 * 같은 글이 걸어 두는 화면에서는 낭독이 되고 앉아서 보는 화면에서는 읽을거리가 된다.
 *
 * 눈높이가 골격을 가른다 (`data-level`). 초등은 궤도를 위로 올려 지면이 화면을 다 쓰고
 * 활자와 그림이 가장 크다. 중등은 왼쪽 궤도와 두 열을 그대로 쓴다. 고등은 궤도를 좁히고
 * 활자를 한 단계 줄여 자리를 벌고, 그 자리에 값을 재는 기준을 더 편다.
 */
export function PaperBoard({
  level,
  variantLabel,
  scopeLabel,
  scopeInfo,
  stats,
  weather,
  forecast,
  clock,
  date,
  nowHour,
  isLive,
  scopePicker,
  levelPicker,
}: PaperBoardProps) {
  // 교육 화면의 글씨 기준을 키운다 — 공용 레이아웃을 쓰지 않으므로 여기서 직접 붙인다.
  useRootClass('solar-edu');

  const script = PAPER_SCRIPT[level];
  const turnMs = CHAPTER_MS[level];
  const pager = useAutoPager({ total: CHAPTER_IDS.length, perPage: 1, intervalMs: turnMs });

  const chapters: Record<ChapterId, ReactNode> = {
    principle: <ChapterPrinciple stats={stats} script={script} />,
    summary: <ChapterSummary stats={stats} script={script} level={level} />,
    carbon: <ChapterCarbon stats={stats} script={script} level={level} />,
  };

  return (
    <div className={styles.paper} data-level={level}>
      <PaperBackdrop nowHour={nowHour} level={level} kind={weather.kind} />

      <aside className={styles.rail}>
        <div className={styles.scope}>
          <p className={styles.scope__variant}>{variantLabel}</p>
          <h1 className={styles.scope__title}>{scopeLabel}</h1>
          <p className={styles.scope__info}>{scopeInfo}</p>
        </div>

        <div className={styles.clock}>
          <p className={styles.clock__time}>{clock}</p>
          <p className={styles.clock__date}>
            {date} · {WEATHER_META[weather.kind].label}
          </p>

          {/* 계측이 끊기면 화면의 값이 언제 것인지 알 수 없다 (SFR-005-10) */}
          {!isLive && <p className={styles.clock__offline}>계측값이 들어오지 않고 있습니다</p>}
        </div>

        <ol className={styles.marks}>
          {CHAPTER_IDS.map((id, index) => (
            <li key={id}>
              <button
                type="button"
                className={styles.mark}
                data-current={index === pager.page}
                onClick={() => pager.goTo(index)}
              >
                <span className={styles.mark__no}>{String(index + 1).padStart(2, '0')}</span>
                <span className={styles.mark__name}>{CHAPTER_MARK[id]}</span>

                {/*
                  머무는 시간이 얼마나 남았는지.
                  `turnKey` 를 열쇠로 두어 장이 넘어갈 때마다 처음부터 다시 찬다.
                */}
                {index === pager.page && (
                  <span
                    key={pager.turnKey}
                    className={styles.mark__timer}
                    style={{ animationDuration: `${turnMs}ms` }}
                  />
                )}
              </button>
            </li>
          ))}
        </ol>

        {/*
          기상은 기둥의 아래쪽에 둔다 (2026-09-04 회의).

          위의 차례가 「무엇을 읽고 있나」 를 말하고 이 칸이 「지금 바깥이 어떤가」 를 말한다.
          지면은 장이 넘어가며 바뀌지만 이 둘은 늘 같은 자리에 남아, 읽던 곳을 잃지 않게 한다.
        */}
        <WeatherPanel today={weather} forecast={forecast} stacked />

        <div className={styles.tools}>
          {scopePicker}
          {levelPicker}
        </div>
      </aside>

      <main className={styles.sheet}>
        <p className={styles.sheet__banner}>{script.banner}</p>

        {CHAPTER_IDS.map((id, index) => (
          <article key={id} className={styles.chapter} data-current={index === pager.page}>
            <header className={styles.chapter__head}>
              {/* 장마다 그림 하나. 무엇을 묻는 장인지 글자를 읽기 전에 한 번 알려 준다 */}
              <p className={styles.chapter__mark}>
                <span className={styles.chapter__icon}>
                  <ChapterGlyph id={id} />
                </span>
                {String(index + 1).padStart(2, '0')} · {CHAPTER_MARK[id]}
              </p>
              <h2 className={styles.chapter__question}>{script.heads[id].question}</h2>
              <p className={styles.chapter__lead}>{script.heads[id].lead}</p>
            </header>

            <div className={styles.chapter__body}>{chapters[id]}</div>
          </article>
        ))}
      </main>
    </div>
  );
}
