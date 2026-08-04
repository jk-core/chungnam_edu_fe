import { Link } from 'react-router-dom';
import { CloseIcon, ExpandIcon } from '@/components/common/Icon';
import { WeatherIcon } from '@/components/common/DataCalendar/WeatherIcon';
import { WEATHER_META } from '@/mocks/weather';
import { PATH } from '@/routes/routes';
import { useFullscreen } from '@/hooks/useFullscreen';
import type { WeatherKind } from '@/interface/weather';
import styles from './SolarEduLayout.module.scss';
import type { ReactNode } from 'react';

interface SolarEduLayoutProps {
  /** 조회 대상 이름 — 학교를 지정했으면 그 학교, 아니면 도 전체 */
  scopeLabel: string;
  weather: WeatherKind;
  /** 계측값이 들어오고 있는지 (SFR-005-10) */
  isLive: boolean;
  clock: string;
  date: string;
  /** 위쪽에 고정으로 붙는 지금 이 순간의 수치 */
  headline: ReactNode;
  /** 번갈아 띄우는 한 줄 설명 전부 */
  facts: string[];
  /** 지금 보여 주는 문구 */
  factIndex: number;
  /** 점을 눌러 그 문구로 건너뛴다 */
  onSelectFact: (index: number) => void;
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
  weather,
  isLive,
  clock,
  date,
  headline,
  facts,
  factIndex,
  onSelectFact,
  children,
}: SolarEduLayoutProps) {
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen();

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

        {!isLive ? (
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
      <p className={styles.ticker} role="status">
        <span className={styles.ticker__label}>알고 계셨나요</span>
        <span
          key={factIndex}
          className={styles.ticker__text}
        >
          {facts[factIndex]}
        </span>

        {/* 지나간 문구가 궁금하면 눌러서 되돌려 볼 수 있다 */}
        <span className={styles.ticker__dots}>
          {facts.map((item, index) => (
            <button
              key={item}
              type="button"
              className={index === factIndex ? styles['ticker__dot--active'] : styles.ticker__dot}
              onClick={() => onSelectFact(index)}
              aria-label={`${index + 1}번째 이야기 보기 (전체 ${facts.length}건)`}
              aria-current={index === factIndex ? 'true' : undefined}
            />
          ))}
        </span>
      </p>

      <div className={styles.body}>{children}</div>
    </div>
  );
}
