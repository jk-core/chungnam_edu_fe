import { useMemo } from 'react';
import { formatNumber } from '@/utils/format';
import { isAbnormal } from '@/mocks/status';
import type { AlertRecord } from '@/interface/alert';
import type { CollectionStatus } from '@/interface/collection';
import type { School } from '@/interface/energy';
import { Panel } from '@/pages/ControlRoom/components/Panel';
import { RegionMap } from '@/pages/ControlRoom/components/RegionMap';
import { orderRegionNames, useRegionTour } from '@/pages/ControlRoom/utils/regionTour';
import { ProvinceBoard } from './ProvinceBoard';
import { RegionStatMap } from './RegionStatMap';
import { ScanStrip } from './ScanStrip';
import styles from './MapBoard.module.scss';

interface Totals {
  outputKw: number;
  capacityKw: number;
  todayKwh: number;
  monthKwh: number;
  yearKwh: number;
}

/**
 * 관내 발전소 현황 — 「한눈에 보는」 시안이 쓰는 판.
 *
 * 네 켜가 위에서 아래로 좁혀 읽힌다.
 *
 * 1. **충남 전체 박스** — 「도 전체로는 얼마인가」. 먼저 읽고 아래에서 좁혀 간다.
 * 2. **충남 전체 도형** 과 그 옆 시·군 상세 — 「어느 시·군이 어떤가」.
 * 3. **그 시·군만 당긴 지도** — 「그곳이 도 안에서 어디인가」. 위 도형은 열다섯을 다 보여 주느라
 *    한 곳을 크게 짚지 못하는데, 당긴 지도가 그 몫을 한다.
 * 4. **실시간 이상 감지** — 「그 시·군에 무엇이 있고 무엇이 잡혔나」. 위 당긴 지도와 **같은 시·군의
 *    개소만** 세우고, 이상이 걸린 줄에 표를 단다. 개소가 많은 시·군은 쪽을 넘겨 가며 다 지나간다.

 * 켜 넷이 같은 시계(`useRegionTour`)를 보므로 늘 같은 시·군을 가리킨다.
 *
 * 도형은 600:516 비율이라 **높이**에 맞춰 큰다. 위쪽을 판 폭 전체로 주면 그 폭을 채우는 데 855px
 * 이 필요해 양옆이 크게 비므로, 도형은 왼쪽에 두고 오른쪽을 상세 칸이 받는다.
 *
 * 상세 칸의 「손봐야 할 곳」 은 끈다 — 셋째 켜가 같은 것을 더 넓게 말하므로, 두 자리에 같은 학교
 * 이름이 서면 어느 쪽을 봐야 하는지 흐려진다.
 */
export function MapBoard({
  plants, totals, abnormalCount, collection, alerts,
}: {
  plants: School[];
  totals: Totals;
  abnormalCount: number;
  collection: Map<string, CollectionStatus>;
  /** 아직 손대지 않은 알림 — 감지 목록이 「언제부터 걸렸나」 를 여기서 센다 */
  alerts: AlertRecord[];
}) {
  // 순회 차례는 상세 칸·감지 리스트와 같은 것을 쓴다 — 셋이 늘 같은 시·군을 가리켜야 한다
  const regions = useMemo(() => {
    const byRegion = new Map<string, School[]>();

    plants.forEach((plant) => {
      const bucket = byRegion.get(plant.regionName);

      if (bucket) bucket.push(plant);
      else byRegion.set(plant.regionName, [plant]);
    });

    return orderRegionNames(plants).map((name) => ({ name, rows: byRegion.get(name) ?? [] }));
  }, [plants]);

  const tour = useRegionTour(regions.length);
  const active = regions[tour.index] ?? regions[0];
  const activeAbnormal = active ? active.rows.filter((row) => isAbnormal(row.status)).length : 0;

  return (
    <Panel
      title="관내 발전소 현황"
      note={`${formatNumber(plants.length)}개소 · 이상 ${formatNumber(abnormalCount)}개소`}
      grow
    >
      <div className={styles.board}>
        <ProvinceBoard plants={plants} totals={totals} abnormalCount={abnormalCount} />

        <RegionStatMap plants={plants} showShare={false} showFaults={false} />

        <div className={styles.board__row}>
          {active ? (
            <section
              className={styles.spot}
              aria-label={`${active.name} 위치`}
            >
              <p className={styles.spot__head}>
                <span className={styles.spot__name}>{active.name}</span>
                <span className={styles.spot__count}>
                  {formatNumber(active.rows.length)}개소
                  {activeAbnormal > 0 ? ` · 이상 ${formatNumber(activeAbnormal)}` : ''}
                </span>
              </p>
              <RegionMap name={active.name} plants={active.rows} />
            </section>
          ) : null}

          <ScanStrip
            plants={active?.rows ?? []}
            regionName={active?.name ?? ''}
            collection={collection}
            alerts={alerts}
          />
        </div>
      </div>
    </Panel>
  );
}
