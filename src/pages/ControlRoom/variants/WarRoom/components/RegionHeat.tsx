import { formatNumber } from '@/utils/format';
import { isAbnormal } from '@/mocks/status';
import { NOW_HOUR } from '@/mocks/today';
import type { School } from '@/interface/energy';
import { HOURS, RATIO_PEAK, REGION_HOURLY } from '../utils/regionHourly';
import styles from '../WarRoom.module.scss';

/**
 * 아직 오지 않은 시각의 칸이 갖는 밝기.
 * 0 으로 두면 하루가 지금에서 잘려 보이고, 그대로 칠하면 아직 내지 않은 발전량을 이미 낸 것처럼
 * 읽는다. 옅게 남겨 「앞으로 이렇게 갈 것」 으로만 보이게 한다.
 */
const AHEAD_FADE = 0.3;

interface RegionHeatProps {
  plants: School[];
  /** 골라 둔 시·군. 아래 경보 줄이 이 값을 따른다 */
  picked: string | null;
  onPick: (name: string | null) => void;
}

/**
 * 시·군 × 시각 (SFR-004-03/08).
 *
 * 곡선 하나는 도 전체가 언제 처졌는지까지만 말한다. 그 처짐이 도 전체의 날씨였는지 한 시·군의
 * 일이었는지는 열다섯 줄을 나란히 깔아야 갈린다 — 한 줄만 어두우면 그 지역의 문제고, 세로로
 * 죽 어두우면 그 시각 도 전체가 흐렸던 것이다.
 *
 * 칸의 밝기는 출력이 아니라 이용률이다. 출력 그대로 칠하면 천안·아산이 늘 밝아, 잘 돌아서 밝은
 * 것인지 커서 밝은 것인지 가릴 수 없다.
 */
export function RegionHeat({ plants, picked, onPick }: RegionHeatProps) {
  const abnormalByRegion = plants.reduce((map, plant) => {
    if (isAbnormal(plant.status)) map.set(plant.regionName, (map.get(plant.regionName) ?? 0) + 1);

    return map;
  }, new Map<string, number>());

  return (
    <section className={styles.heat} aria-label="시·군별 시간대 이용률">
      <header className={styles.heat__head}>
        <h2 className={styles.heat__title}>시·군 × 시각</h2>
        <p className={styles.heat__note}>
          {picked ? `${picked}만 보는 중 · 다시 누르면 전체` : '칸이 밝을수록 그 시각 이용률이 높다'}
        </p>
      </header>

      <div
        className={styles.grid}
        style={{ '--hours': HOURS.length } as React.CSSProperties}
        data-picked={picked ? '' : undefined}
      >
        {REGION_HOURLY.map((row) => {
          const abnormal = abnormalByRegion.get(row.name) ?? 0;
          const on = picked === row.name;

          return (
            <div key={row.code} className={styles.grid__row} data-on={on ? '' : undefined}>
              <button
                type="button"
                className={styles.grid__name}
                aria-pressed={on}
                onClick={() => onPick(on ? null : row.name)}
              >
                {row.name}
              </button>

              {row.ratio.map((ratio, index) => {
                const ahead = HOURS[index] > NOW_HOUR;
                const level = RATIO_PEAK > 0 ? ratio / RATIO_PEAK : 0;

                return (
                  <span
                    key={HOURS[index]}
                    className={styles.grid__cell}
                    style={{ '--level': ahead ? level * AHEAD_FADE : level } as React.CSSProperties}
                    data-ahead={ahead ? '' : undefined}
                    title={`${row.name} ${String(HOURS[index]).padStart(2, '0')}시 · ${formatNumber(row.kw[index], 1)}kW`}
                  />
                );
              })}

              <span className={styles.grid__tail} data-alert={abnormal > 0 ? '' : undefined}>
                {abnormal > 0 ? `이상 ${abnormal}` : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
