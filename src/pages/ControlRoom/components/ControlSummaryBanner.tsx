import { countOperation, isProducing } from '@/mocks/status';
import { currentOutputOf, todayVsYesterday } from '@/mocks/schoolOutput';
import { formatDelta, formatNumber, formatPercent } from '@/utils/format';
import { useAutoPager } from '@/hooks/useAutoPager';
import type { School } from '@/interface/energy';
import styles from './ControlSummaryBanner.module.scss';

/** 한 줄이 머무는 시간 */
const ROLL_MS = 6000;

interface ControlSummaryBannerProps {
  /** 조건에 걸린 발전소 — 지금 화면이 보고 있는 목록 */
  schools: School[];
  /** 수집이 지연된 개소 수 */
  staleCount: number;
}

/**
 * 관제 요약 롤링 배너 (SFR-004-01/07/13).
 *
 * 벽면 모니터를 지나가며 보는 사람에게 지금 무엇이 중요한지 한 줄로 알린다.
 * 여러 판에 흩어져 있는 수치 가운데 "먼저 알아야 할 것" 만 골라 번갈아 띄운다.
 */
export function ControlSummaryBanner({ schools, staleCount }: ControlSummaryBannerProps) {
  const count = countOperation(schools);
  const running = schools.filter((school) => isProducing(school.status)).length;
  const outputKw = schools.reduce((sum, school) => sum + currentOutputOf(school), 0);
  const todayKwh = schools.reduce((sum, school) => sum + school.todayKwh, 0);
  const day = todayVsYesterday();
  const top = [...schools].sort((a, b) => b.todayKwh - a.todayKwh)[0];
  const abnormal = count.degraded + count.fault + count.commLost;

  const lines: { id: string; tone: 'info' | 'warn'; text: string }[] = [
    {
      id: 'output',
      tone: 'info',
      text: `지금 ${formatNumber(schools.length)}개소에서 ${formatNumber(outputKw, 1)}kW 를 만들고 있습니다 · 금일 누적 ${formatNumber(todayKwh)}kWh`,
    },
    {
      id: 'delta',
      tone: 'info',
      text: `금일 발전량은 어제 같은 시각 대비 ${formatDelta(day.deltaRatio)} 입니다`,
    },
    {
      id: 'running',
      tone: 'info',
      text: `${formatNumber(running)}개소가 발전 중입니다 · 가동률 ${formatPercent(schools.length > 0 ? running / schools.length : 0)}`,
    },
  ];

  if (top) {
    lines.push({
      id: 'top',
      tone: 'info',
      text: `오늘 가장 많이 만든 곳은 ${top.name} 입니다 · ${formatNumber(top.todayKwh)}kWh`,
    });
  }

  if (abnormal > 0) {
    lines.push({
      id: 'abnormal',
      tone: 'warn',
      text: `점검이 필요한 설비가 ${formatNumber(abnormal)}개소 있습니다 · 주의 ${count.degraded} · 경고 ${count.fault} · 통신단절 ${count.commLost}`,
    });
  }

  if (staleCount > 0) {
    lines.push({
      id: 'stale',
      tone: 'warn',
      text: `${formatNumber(staleCount)}개소에서 계측값이 한 시간 넘게 들어오지 않았습니다`,
    });
  }

  // 한 줄씩 넘기는 것도 쪽 넘김이라, 목록·표와 같은 장치를 쓴다 — 눌러서 되돌려 볼 수 있다.
  const { page, pageCount, goTo } = useAutoPager({ total: lines.length, perPage: 1, intervalMs: ROLL_MS });
  const line = lines[Math.min(page, lines.length - 1)];

  return (
    <p className={styles.banner} role="status">
      <span className={styles.banner__label}>실시간 현황</span>

      {/* 문구가 갈릴 때마다 요소를 새로 만들어야 아래에서 밀려 올라오는 움직임이 다시 돈다 */}
      <span
        key={line.id}
        className={styles.banner__text}
        data-tone={line.tone}
      >
        {line.text}
      </span>

      <span className={styles.banner__dots}>
        {lines.map((item, dotIndex) => (
          <button
            key={item.id}
            type="button"
            className={dotIndex === page ? styles['banner__dot--active'] : styles.banner__dot}
            onClick={() => goTo(dotIndex)}
            aria-label={`${dotIndex + 1}번째 소식 보기 (전체 ${pageCount}건)`}
            aria-current={dotIndex === page ? 'true' : undefined}
          />
        ))}
      </span>
    </p>
  );
}
