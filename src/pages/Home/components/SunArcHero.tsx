import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowUpRightIcon, PulseIcon } from '@/components/common/Icon';
import { Button } from '@/components/common/Button';
import { CountUp } from '@/components/common/CountUp';
import { PATH } from '@/routes/routes';
import { REGION_TOTAL } from '@/mocks/regions';
import { formatDate, formatEnergy, formatNumber, formatPercent, formatTime } from '@/utils/format';
import { useHomeHero } from '../hooks/useHome';
import { barsFromFlowChart, hourOfDate, hourOfDateTime } from '../utils/heroChart';
import { SunArc } from './SunArc';
import styles from './SunArcHero.module.scss';

/** 데이터 없을 때 쓰는 충남 대략 일출·일몰 (소수 시간) */
const FALLBACK_SUNRISE = 5.5;
const FALLBACK_SUNSET = 19.6;

/** 1분마다 갱신되는 현재 시각 */
function useClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);

    return () => window.clearInterval(timer);
  }, []);

  return now;
}

export function SunArcHero() {
  const now = useClock();
  const nowHour = hourOfDate(now);
  const { data } = useHomeHero();

  const sunriseHour = data ? hourOfDateTime(data.sunriseTime) : FALLBACK_SUNRISE;
  const sunsetHour = data ? hourOfDateTime(data.sunsetTime) : FALLBACK_SUNSET;
  const bars = data ? barsFromFlowChart(data.flowChartData) : [];
  const today = formatEnergy(data?.dayPower ?? 0);
  /** API `outputRate` 는 % 단위 → formatPercent 는 0~1 비율을 받는다 */
  const outputRatio = (data?.outputRate ?? 0) / 100;
  const isAfterSunset = nowHour >= sunsetHour;

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.hero__inner}>
        <div className={styles.hero__copy}>
          <motion.p
            className={styles.hero__eyebrow}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {formatDate(now)} {formatTime(now)} 기준
          </motion.p>

          <motion.h1
            id="hero-title"
            className={styles.hero__title}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.06 }}
          >
            충남의 학교 지붕이
            <br />
            오늘 만든 전기
          </motion.h1>

          <motion.p
            className={styles.hero__lead}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
          >
            관내 {formatNumber(REGION_TOTAL.schoolCount)}개 학교에 설치된 태양광 설비의 발전량을 15분 주기로 모아
            한자리에서 확인합니다.
          </motion.p>

          <motion.div
            className={styles.hero__readout}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
          >
            <p className={styles.hero__figure}>
              <CountUp value={Number(today.value.replace(/,/g, ''))} fractionDigits={1} startOnView={false} />
              <span className={styles.hero__unit}>{today.unit}</span>
            </p>
            <p className={styles.hero__figureLabel}>금일 발전량</p>
          </motion.div>

          <motion.dl
            className={styles.hero__meta}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24 }}
          >
            <div className={styles.hero__metaItem}>
              <dt>현재 출력</dt>
              <dd>
                <PulseIcon className={styles.hero__metaIcon} />
                {isAfterSunset ? '일몰 · 발전 종료' : formatPercent(outputRatio, 1)}
                {isAfterSunset ? null : <span className={styles.hero__metaSub}>총 설비용량 대비</span>}
              </dd>
            </div>
          </motion.dl>

          <motion.div
            className={styles.hero__actions}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3 }}
          >
            <Link to={PATH.CONTROL}>
              <Button size="lg" iconRight={<ArrowUpRightIcon />}>
                통합관제 보기
              </Button>
            </Link>
            <Link to={PATH.ENERGY_STATISTICS}>
              <Button size="lg" variant="secondary">
                발전통계 보기
              </Button>
            </Link>
          </motion.div>
        </div>

        <div className={styles.hero__viz}>
          <SunArc nowHour={nowHour} sunriseHour={sunriseHour} sunsetHour={sunsetHour} bars={bars} />
          <p className={styles.hero__vizCaption}>
            점선은 오늘 해가 지나는 길이고, 막대는 그 시각에 실제로 낸 출력입니다.
            둘 사이가 벌어진 만큼은 구름에 가려 놓친 몫입니다.
          </p>
        </div>
      </div>
    </section>
  );
}
