import { Link } from 'react-router-dom';
import { CloseIcon, ExpandIcon } from '@/components/common/Icon';
import { cn } from '@/utils/cn';
import { WeatherIcon } from '@/components/common/DataCalendar/WeatherIcon';
import { WEATHER_META } from '@/mocks/weather';
import { PATH } from '@/routes/routes';
import { useFullscreen } from '@/hooks/useFullscreen';
import { useRootClass } from '@/hooks/useRootClass';
import type { WeatherKind } from '@/interface/weather';
import styles from './SolarEduLayout.module.scss';
import type { CSSProperties, ReactNode } from 'react';

interface SolarEduLayoutProps {
  /** 조회 대상 이름 — 학교를 지정했으면 그 학교, 아니면 도 전체 */
  scopeLabel: string;
  /**
   * 어느 시안을 보고 있는지.
   * 시안 여럿을 나란히 놓고 고르는 동안에만 쓴다 — 고르고 나면 지운다.
   */
  variantLabel?: string;
  /** 학교를 고르는 손잡이. 상황판마다 다른 학교를 띄우기 위해 둔다. */
  scopePicker?: ReactNode;
  /** 학교 기본 정보 — 설비용량·설치일 등 한 줄 요약 */
  scopeInfo?: string;
  /** 눈높이(초·중·고)를 고르는 손잡이 (SFR-005-04) */
  levelPicker?: ReactNode;
  /** 화면 뒤에 까는 그림. 초등 판이 하늘을 깐다 (SFR-005-06) */
  backdrop?: ReactNode;
  /**
   * 깔린 배경이 어떤 결인지.
   *
   * `bright` 는 밝은 하늘을 못 박은 그림이라 그 위 글자색까지 밝은 바탕용으로 고정한다 —
   * 어두운 테마의 옅은 글씨를 흰 카드 위에 그대로 두면 글자가 사라지기 때문이다.
   * `theme` 는 배경 자체가 화면 모드를 따르므로 색을 건드리지 않는다.
   */
  weather: WeatherKind;
  /** 계측값이 들어오고 있는지 (SFR-005-10) */
  isLive: boolean;
  /** 완전히 멎었을 때 띄울 한 줄. 없으면 멎지 않은 것으로 본다 */
  stoppedNote?: string;
  clock: string;
  date: string;
  /** 위쪽에 고정으로 붙는 지금 이 순간의 수치 */
  headline: ReactNode;
  /**
   * 번갈아 띄우는 한 줄 설명 전부.
   * 넘기지 않으면 아래 줄 자체를 두지 않는다 — 본문이 이미 한 줄씩 바뀌는 판(초등)에서는
   * 읽을 곳이 둘이 되어 오히려 산만해진다.
   */
  facts?: string[];
  /** 지금 보여 주는 문구 */
  factIndex?: number;
  /** 한 문구가 머무는 시간(ms) — 지금 눈금이 차오르는 데 걸리는 시간이다 */
  factMs?: number;
  /** 점을 눌러 그 문구로 건너뛴다 */
  onSelectFact?: (index: number) => void;
  children: ReactNode;
}

/**
 * 교육용 대시보드 골격 (SFR-005).
 *
 * 복도·강당 모니터에 걸어 두고 조작 없이 돌리는 화면이라 헤더·LNB·푸터를 두지 않고,
 * KRDS 좌우 여백 대신 화면을 다 쓴다. 페이지를 넘기지 않고 한 화면에 담되,
 * 움직임은 각 패널이 스스로 만든다.
 */
export function SolarEduLayout({
  scopeLabel,
  variantLabel,
  scopePicker,
  scopeInfo,
  levelPicker,
  backdrop,
  weather,
  isLive,
  stoppedNote,
  clock,
  date,
  headline,
  facts,
  factIndex,
  factMs,
  onSelectFact,
  children,
}: SolarEduLayoutProps) {
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

  /*
    멀리서 읽는 화면이라 글씨 기준을 한 단계 키운다 (SFR-005-04).
    `rem` 기준은 문서 뿌리에서만 정해지므로 클래스도 뿌리에 붙인다 — 크기 자체는
    `_global.scss` 의 `html.solar-edu` 한 곳에 있다.
  */
  useRootClass('solar-edu');

  return (
    <div
      className={cn(styles.edu, {
        [styles['edu--backdrop']]: Boolean(backdrop),
      })}
    >
      {backdrop}

      <header className={styles.top}>
        <div className={styles.bar}>
          <div>
            {/* 손잡이(선택기·세그먼트)를 품으므로 문단이 아니라 묶음으로 둔다 */}
            <div className={styles.bar__scope}>
              {scopeLabel}
              {scopePicker}
              {levelPicker}
              {variantLabel ? <em className={styles.bar__variant}>{variantLabel}</em> : null}
            </div>
            <h1 className={styles.bar__title}>우리 학교 지붕이 만드는 전기</h1>
            {scopeInfo ? <p className={styles.bar__info}>{scopeInfo}</p> : null}
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

            {/* 모니터에 걸어 두는 화면이라 브라우저 UI 를 걷어 낼 수 있게 한다 (SFR-005-08) */}
            <button
              type="button"
              className={styles.bar__action}
              onClick={toggleFullscreen}
            >
              <ExpandIcon width={16} height={16} />
              {isFullscreen ? '창 모드' : '전체화면'}
            </button>

            <Link to={PATH.HOME} className={styles.bar__action}>
              <CloseIcon width={16} height={16} />
              나가기
            </Link>
          </div>
        </div>

        {/*
          멎었거나 끊겼을 때 (SFR-005-10).

          임계값으로 고장을 가리지는 않는다 — 시군마다 센서 편차가 커서 상시 걸린다 (2026-09-04 회의).
          「해는 떠 있는데 아무것도 만들지 못하고 있다」 는 한 가지만 짚고, 그 문구는 눈높이를 아는
          화면 쪽이 정해 넘긴다.
        */}
        {stoppedNote ? (
          <p className={cn(styles.offline, styles['offline--stopped'])} role="status">{stoppedNote}</p>
        ) : !isLive ? (
          <p className={styles.offline} role="status">
            지금 값이 들어오지 않아, 마지막으로 받은 값을 그대로 보여 주고 있어요.
          </p>
        ) : null}

        {headline}
      </header>

      {/*
        알고 계셨나요 한 줄. 문구가 바뀔 때마다 아래에서 밀려 올라온다 —
        `key` 를 문구로 두어 글이 갈릴 때 요소가 새로 만들어지고 CSS 애니메이션이 다시 돈다.
      */}
      {facts && facts.length > 0 ? (
        <p className={styles.ticker} role="status">
          <span className={styles.ticker__label}>알고 계셨나요</span>
          <span
            key={factIndex}
            className={styles.ticker__text}
          >
            {facts[factIndex ?? 0]}
          </span>

          {/* 지나간 문구가 궁금하면 눌러서 되돌려 볼 수 있다 */}
          <span className={styles.ticker__dots}>
            {facts.map((item, index) => {
              const isOn = index === factIndex;

              return (
                /* 지금 칸은 넘어갈 때마다 새로 만든다 — 그래야 채움이 처음부터 다시 흐른다 */
                <button
                  key={isOn ? `on-${factIndex}` : item}
                  type="button"
                  className={isOn ? styles['ticker__dot--active'] : styles.ticker__dot}
                  style={isOn && factMs ? ({ '--rotation-ms': `${factMs}ms` } as CSSProperties) : undefined}
                  onClick={() => onSelectFact?.(index)}
                  aria-label={`${index + 1}번째 이야기 보기 (전체 ${facts.length}건)`}
                  aria-current={isOn ? 'true' : undefined}
                />
              );
            })}
          </span>
        </p>
      ) : null}

      <div className={styles.body}>{children}</div>
    </div>
  );
}
