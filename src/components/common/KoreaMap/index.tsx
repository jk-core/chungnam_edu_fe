import { useMemo, useState } from 'react';
import Chungcheongbukdo from '@/assets/geo/provinces/Chungcheongbukdo';
import Chungcheongnamdo from '@/assets/geo/provinces/Chungcheongnamdo';
import Gangwondo from '@/assets/geo/provinces/Gangwondo';
import Gyeonggido from '@/assets/geo/provinces/Gyeonggido';
import Gyeongsangbukdo from '@/assets/geo/provinces/Gyeongsangbukdo';
import Gyeongsangnamdo from '@/assets/geo/provinces/Gyeongsangnamdo';
import Jejudo from '@/assets/geo/provinces/Jejudo';
import Junrabukdo from '@/assets/geo/provinces/Junrabukdo';
import Junranamdo from '@/assets/geo/provinces/Junranamdo';
import { cn } from '@/utils/cn';
import styles from './KoreaMap.module.scss';

/** 도별 평균 발전시간 — 지도·순위 막대가 같은 배열을 본다 */
export interface KoreaMapRegion {
  code: string;
  name: string;
  avgGenerationHours: number;
}

const STEPS = 5;
const EMPTY_LABEL = '-';

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

/** 지도에 항상 그리는 9개 도 — 값이 없어도 윤곽은 남긴다 */
const PROVINCES: { code: string; name: string; Component: typeof Gangwondo }[] = [
  { code: 'gangwon', name: '강원도', Component: Gangwondo },
  { code: 'gyeonggi', name: '경기도', Component: Gyeonggido },
  { code: 'chungbuk', name: '충청북도', Component: Chungcheongbukdo },
  { code: 'chungnam', name: '충청남도', Component: Chungcheongnamdo },
  { code: 'jeonbuk', name: '전라북도', Component: Junrabukdo },
  { code: 'jeonnam', name: '전라남도', Component: Junranamdo },
  { code: 'gyeongbuk', name: '경상북도', Component: Gyeongsangbukdo },
  { code: 'gyeongnam', name: '경상남도', Component: Gyeongsangnamdo },
  { code: 'jeju', name: '제주도', Component: Jejudo },
];

interface RankRow {
  code: string;
  name: string;
  hours: number | null;
}

interface KoreaMapProps {
  /** 강조할 도 코드 */
  highlight?: string;
  /** 도별 평균 발전시간 (없는 도는 목록에 없어도 된다) */
  regions: KoreaMapRegion[];
}

function formatHours(hours: number | null): string {
  return hours === null ? EMPTY_LABEL : hours.toFixed(2);
}

/**
 * 전국 지역별 평균 발전시간 지도 (SFR-006-03/04).
 * 값이 높은 도가 진해진다. 색만으로 읽히지 않도록 지도 위에 수치를 적고 옆에 순위 막대를 붙였다 (COR-003).
 * 데이터가 없는 도도 윤곽은 그리고, 수치는 「-」로 둔다.
 */
export function KoreaMap({ highlight = 'chungnam', regions }: KoreaMapProps) {
  const [focus, setFocus] = useState<string | null>(null);

  const { rows, min, max, average, byCode } = useMemo(() => {
    const byCode = new Map(regions.map((item) => [item.code, item]));
    const withData = PROVINCES.map((province) => {
      const hit = byCode.get(province.code);

      return {
        code: province.code,
        name: province.name,
        hours: hit ? hit.avgGenerationHours : null,
      } satisfies RankRow;
    });
    const ranked = [...withData].sort((a, b) => {
      if (a.hours === null && b.hours === null) return 0;
      if (a.hours === null) return 1;
      if (b.hours === null) return -1;

      return b.hours - a.hours;
    });
    const hours = ranked.flatMap((row) => (row.hours === null ? [] : [row.hours]));
    const empty = hours.length === 0;
    const sum = hours.reduce((total, value) => total + value, 0);

    return {
      rows: ranked,
      min: empty ? null : Math.min(...hours),
      max: empty ? null : Math.max(...hours),
      average: empty ? null : Math.round((sum / hours.length) * 100) / 100,
      byCode,
    };
  }, [regions]);

  const span = (max ?? 0) - (min ?? 0) || 1;
  const stepOf = (value: number) => Math.min(STEPS, Math.max(1, Math.ceil(((value - (min ?? 0)) / span) * STEPS)));
  const barWidth = (value: number) => 12 + ((value - (min ?? 0)) / span) * 88;
  const active = focus ?? highlight;
  /*
    SVG 는 문서 순서대로 위에 쌓인다.
    활성 도의 주황 테두리가 이웃 fill 에 가려지지 않도록 맨 나중에 그린다.
  */
  const stackedProvinces = useMemo(
    () => [...PROVINCES].sort((a, b) => Number(a.code === active) - Number(b.code === active)),
    [active],
  );

  return (
    <div className={styles.koreaMap}>
      <div className={styles.mapWrap}>
        <svg
          className={styles.svg}
          viewBox="108 18 306 466"
          role="img"
          aria-label={`전국 지역별 평균 발전시간 지도. 전국 평균 ${formatHours(average)}시간. 아래 순위 목록에서 같은 값을 확인할 수 있습니다.`}
        >
          {stackedProvinces.map(({ code, name, Component }) => {
            const region = byCode.get(code);
            const hours = region?.avgGenerationHours ?? null;

            return (
              <g
                key={code}
                className={cn(styles.province, {
                  [styles['province--active']]: code === active,
                  [styles['province--empty']]: hours === null,
                })}
                onMouseEnter={() => setFocus(code)}
                onMouseLeave={() => setFocus(null)}
              >
                <title>
                  {hours === null
                    ? `${name} 평균 발전시간 없음`
                    : `${name} 평균 발전시간 ${hours.toFixed(2)}시간`}
                </title>
                <Component
                  fill={hours === null ? 'var(--surface-sunken)' : `var(--map-scale-${stepOf(hours)})`}
                  stroke="var(--surface)"
                />
              </g>
            );
          })}

          {/* 수치를 지도에 직접 얹어, 색을 구분하지 못해도 읽을 수 있게 한다. */}
          {PROVINCES.map(({ code, name }) => {
            const at = LABEL[code];
            const hours = byCode.get(code)?.avgGenerationHours ?? null;

            if (!at) return null;

            return (
              <g key={`label-${code}`}>
                <rect className={styles.labelPlate} x={at.x - 19} y={at.y - 17} width={38} height={24} rx={5} />
                <text className={styles.labelName} x={at.x} y={at.y - 7}>
                  {name.replace('도', '')}
                </text>
                <text className={styles.label} x={at.x} y={at.y + 4}>
                  {formatHours(hours)}
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
            <span>{formatHours(min)}</span>
            <span>전국 평균 {formatHours(average)}</span>
            <span>{formatHours(max)}</span>
          </div>
        </div>

        <div className={styles.rank}>
          <p className={styles.rank__title}>지역별 순위</p>
          <ol className={styles.rank__list}>
            {rows.map((row, index) => (
              <li key={row.code}>
                <button
                  type="button"
                  className={cn(styles.rank__item, { [styles['rank__item--self']]: row.code === active })}
                  onMouseEnter={() => setFocus(row.code)}
                  onMouseLeave={() => setFocus(null)}
                  onFocus={() => setFocus(row.code)}
                  onBlur={() => setFocus(null)}
                >
                  <span className={styles.rank__order}>{row.hours === null ? EMPTY_LABEL : index + 1}</span>
                  <span className={styles.rank__name}>{row.name}</span>
                  <span className={styles.rank__barTrack}>
                    {row.hours !== null ? (
                      <span className={styles.rank__bar} style={{ width: `${barWidth(row.hours)}%` }} />
                    ) : null}
                  </span>
                  <span className={styles.rank__value}>
                    {row.hours === null ? EMPTY_LABEL : `${row.hours.toFixed(2)}h`}
                  </span>
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
