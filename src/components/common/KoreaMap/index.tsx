import { useState } from 'react';
import Chungcheongbukdo from '@/assets/geo/provinces/Chungcheongbukdo';
import Chungcheongnamdo from '@/assets/geo/provinces/Chungcheongnamdo';
import Gangwondo from '@/assets/geo/provinces/Gangwondo';
import Gyeonggido from '@/assets/geo/provinces/Gyeonggido';
import Gyeongsangbukdo from '@/assets/geo/provinces/Gyeongsangbukdo';
import Gyeongsangnamdo from '@/assets/geo/provinces/Gyeongsangnamdo';
import Jejudo from '@/assets/geo/provinces/Jejudo';
import Junrabukdo from '@/assets/geo/provinces/Junrabukdo';
import Junranamdo from '@/assets/geo/provinces/Junranamdo';
import {
  getNationalRanking,
  NATIONAL_AVERAGE,
  NATIONAL_MAX,
  NATIONAL_MIN,
  NATIONAL_REGIONS,
} from '@/mocks/national';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import styles from './KoreaMap.module.scss';

const STEPS = 5;

/**
 * 도별 라벨 위치. 실제 경로의 화면 좌표를 재어 잡았다.
 * 경로 데이터가 절대 좌표라 뷰박스가 고정이면 이 값도 고정이다.
 */
const LABEL: Record<string, { x: number; y: number }> = {
  gyeonggi: { x: 194, y: 115 },
  gangwon: { x: 286, y: 93 },
  chungbuk: { x: 263, y: 193 },
  chungnam: { x: 183, y: 200 },
  jeonbuk: { x: 203, y: 267 },
  jeonnam: { x: 190, y: 340 },
  gyeongbuk: { x: 326, y: 213 },
  gyeongnam: { x: 300, y: 305 },
  // 제주는 본토와 떨어져 있어 라벨을 섬 위쪽에 둔다.
  jeju: { x: 168, y: 436 },
};

const PROVINCES: { code: string; Component: typeof Gangwondo }[] = [
  { code: 'gangwon', Component: Gangwondo },
  { code: 'gyeonggi', Component: Gyeonggido },
  { code: 'chungbuk', Component: Chungcheongbukdo },
  { code: 'chungnam', Component: Chungcheongnamdo },
  { code: 'jeonbuk', Component: Junrabukdo },
  { code: 'jeonnam', Component: Junranamdo },
  { code: 'gyeongbuk', Component: Gyeongsangbukdo },
  { code: 'gyeongnam', Component: Gyeongsangnamdo },
  { code: 'jeju', Component: Jejudo },
];

interface KoreaMapProps {
  /** 강조할 도 코드 */
  highlight?: string;
}

/** 값을 1~5 단계로 접는다. */
function stepOf(value: number): number {
  const ratio = (value - NATIONAL_MIN) / (NATIONAL_MAX - NATIONAL_MIN || 1);

  return Math.min(STEPS, Math.max(1, Math.ceil(ratio * STEPS)));
}

/**
 * 전국 지역별 평균 발전시간 지도 (SFR-006-03/04).
 * 값이 높은 도가 진해진다. 색만으로 읽히지 않도록 지도 위에 수치를 적고 옆에 순위 막대를 붙였다 (COR-003).
 */
export function KoreaMap({ highlight = 'chungnam' }: KoreaMapProps) {
  const ranking = getNationalRanking();
  const [focus, setFocus] = useState<string | null>(null);

  const span = NATIONAL_MAX - NATIONAL_MIN || 1;
  const barWidth = (value: number) => 12 + ((value - NATIONAL_MIN) / span) * 88;
  const byCode = new Map(NATIONAL_REGIONS.map((item) => [item.code, item]));
  const active = focus ?? highlight;

  return (
    <div className={styles.koreaMap}>
      <div className={styles.mapWrap}>
        <svg
          className={styles.svg}
          viewBox="108 18 306 466"
          role="img"
          aria-label={`전국 지역별 평균 발전시간 지도. 전국 평균 ${NATIONAL_AVERAGE.toFixed(2)}시간. 아래 순위 목록에서 같은 값을 확인할 수 있습니다.`}
        >
          {PROVINCES.map(({ code, Component }) => {
            const region = byCode.get(code);

            if (!region) return null;

            return (
              <g
                key={code}
                className={cn(styles.province, { [styles['province--active']]: code === active })}
                onMouseEnter={() => setFocus(code)}
                onMouseLeave={() => setFocus(null)}
              >
                <title>
                  {`${region.name} 평균 발전시간 ${region.avgGenerationHours.toFixed(2)}시간, 설비용량 ${formatNumber(region.capacityMw)}MW`}
                </title>
                <Component fill={`var(--map-scale-${stepOf(region.avgGenerationHours)})`} stroke="var(--surface)" />
              </g>
            );
          })}

          {/* 수치를 지도에 직접 얹어, 색을 구분하지 못해도 읽을 수 있게 한다. */}
          {PROVINCES.map(({ code }) => {
            const region = byCode.get(code);
            const at = LABEL[code];

            if (!region || !at) return null;

            return (
              <g key={`label-${code}`}>
                <rect className={styles.labelPlate} x={at.x - 19} y={at.y - 17} width={38} height={24} rx={5} />
                <text className={styles.labelName} x={at.x} y={at.y - 7}>
                  {region.name.replace('도', '')}
                </text>
                <text className={styles.label} x={at.x} y={at.y + 4}>
                  {region.avgGenerationHours.toFixed(2)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className={styles.side}>
        <div className={styles.legend}>
          <p className={styles.legend__title}>평균 발전시간 (h/일)</p>
          <div className={styles.legend__scale} aria-hidden="true">
            {Array.from({ length: STEPS }, (_, index) => (
              <span
                key={index}
                className={styles.legend__step}
                style={{ backgroundColor: `var(--map-scale-${index + 1})` }}
              />
            ))}
          </div>
          <div className={styles.legend__bounds}>
            <span>{NATIONAL_MIN.toFixed(2)}</span>
            <span>전국 평균 {NATIONAL_AVERAGE.toFixed(2)}</span>
            <span>{NATIONAL_MAX.toFixed(2)}</span>
          </div>
        </div>

        <div className={styles.rank}>
          <p className={styles.rank__title}>지역별 순위</p>
          <ol className={styles.rank__list}>
            {ranking.map((region, index) => (
              <li key={region.code}>
                <button
                  type="button"
                  className={cn(styles.rank__item, { [styles['rank__item--self']]: region.code === active })}
                  onMouseEnter={() => setFocus(region.code)}
                  onMouseLeave={() => setFocus(null)}
                  onFocus={() => setFocus(region.code)}
                  onBlur={() => setFocus(null)}
                >
                  <span className={styles.rank__order}>{index + 1}</span>
                  <span className={styles.rank__name}>{region.name}</span>
                  <span className={styles.rank__barTrack}>
                    <span className={styles.rank__bar} style={{ width: `${barWidth(region.avgGenerationHours)}%` }} />
                  </span>
                  <span className={styles.rank__value}>{region.avgGenerationHours.toFixed(2)}h</span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <p className={styles.note}>
          한국에너지공단 REMS 연계 값입니다. 지도가 도 단위라 광역시는 소속 도에 합쳐 집계했습니다.
        </p>
      </div>
    </div>
  );
}
