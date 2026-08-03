import { WeatherIcon } from '@/components/common/DataCalendar/WeatherIcon';
import { WEATHER_META } from '@/mocks/weather';
import { cn } from '@/utils/cn';
import type { SceneMeta } from '@/mocks/solarEdu';
import type { WeatherKind } from '@/interface/weather';
import styles from './SolarEduLayout.module.scss';
import type { CSSProperties, ReactNode } from 'react';

interface SolarEduLayoutProps {
  /** 조회 대상 이름 — 학교를 지정했으면 그 학교, 아니면 도 전체 */
  scopeLabel: string;
  scenes: SceneMeta[];
  /** 지금 씬의 인덱스 — 아래 진행 막대를 채운다 */
  sceneIndex: number;
  /** 한 씬이 머무는 시간(ms) */
  sceneMs: number;
  weather: WeatherKind;
  /** 계측값이 들어오고 있는지 (SFR-005-10) */
  isLive: boolean;
  clock: string;
  date: string;
  /** 위쪽에 고정으로 붙는 지금 이 순간의 수치 */
  headline: ReactNode;
  /** 하단 단계를 눌렀을 때 */
  onSelectScene: (index: number) => void;
  /**
   * 진행 막대를 처음부터 다시 채우게 하는 값.
   * 손으로 골라 타이머가 리셋될 때마다 바뀌며, 이 값이 달라지면 막대 요소를 새로 만든다 —
   * CSS 애니메이션은 같은 요소에 다시 걸어도 되감기지 않는다.
   */
  progressKey: number;
  /** 하단에 흐르는 한 줄 설명 */
  fact: string;
  /** 회전하는 부분 */
  children: ReactNode;
}

/**
 * 교육용 대시보드 골격 (SFR-005).
 *
 * 위쪽은 고정이다 — 대상과 지금 이 순간의 수치는 어느 씬에서든 계속 보여야 한다.
 * 중앙부터 아래는 회전 영역으로, 씬이 옆으로 미끄러지며 갈린다.
 */
export function SolarEduLayout({
  scopeLabel,
  scenes,
  sceneIndex,
  sceneMs,
  weather,
  isLive,
  clock,
  date,
  headline,
  onSelectScene,
  progressKey,
  fact,
  children,
}: SolarEduLayoutProps) {
  return (
    <div className={styles.edu}>
      <header className={styles.top}>
        <div className={styles.bar}>
          <div>
            <p className={styles.bar__scope}>{scopeLabel}</p>
            <h1 className={styles.bar__title}>우리 학교 지붕이 만드는 전기</h1>
          </div>

          <div className={styles.bar__right}>
            <span className={styles.bar__weather}>
              <WeatherIcon kind={weather} size={20} />
              {WEATHER_META[weather].label}
            </span>
            <span>
              <span className={styles.bar__clock}>{clock}</span>
              <span className={styles.bar__date}>{date}</span>
            </span>
          </div>
        </div>

        {!isLive ? (
          <p className={styles.offline} role="status">
            계측값이 들어오지 않아 마지막으로 받은 값을 그대로 보여 주고 있습니다.
          </p>
        ) : null}

        {headline}
      </header>

      {/* 씬이 옆으로 미끄러져 갈리는 자리. 밖으로 삐져나가는 부분은 여기서 자른다 */}
      <div className={styles.stage}>{children}</div>

      <div className={styles.foot}>
        {/*
          지금 몇 번째 화면이고 언제 넘어가는지. 조작 없이 도는 화면이지만, 앞 내용을 다시
          보고 싶을 때가 있어 눌러서 건너뛸 수 있게 뒀다.
        */}
        <ol className={styles.dots} aria-label={`전체 ${scenes.length}개 화면 중 ${sceneIndex + 1}번째`}>
          {scenes.map((item, index) => (
            <li key={item.key}>
              <button
                key={index === sceneIndex ? `active-${progressKey}` : 'idle'}
                type="button"
                className={cn(styles.dot, { [styles['dot--active']]: index === sceneIndex })}
                style={index === sceneIndex ? ({ '--scene-ms': `${sceneMs}ms` } as CSSProperties) : undefined}
                aria-current={index === sceneIndex ? 'step' : undefined}
                onClick={() => onSelectScene(index)}
              >
                <span className={styles.dot__title}>{item.title}</span>
              </button>
            </li>
          ))}
        </ol>

        <p className={styles.ticker} role="status">
          {fact}
        </p>
      </div>
    </div>
  );
}
