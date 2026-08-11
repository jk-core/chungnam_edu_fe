import { useState } from 'react';
import { Map } from 'react-kakao-maps-sdk';
import { CloseIcon } from '@/components/common/Icon';
import { OPERATION_LABEL } from '@/mocks/status';
import { cn } from '@/utils/cn';
import type { OperationStatus } from '@/interface/status';
import type { School } from '@/interface/energy';
import { CENTER, centerOn, DEFAULT_LEVEL, fitToCluster, TONE_CLASS } from './kakaoMarkers';
import { PlantMapLayer } from './PlantMapLayer';
import styles from './GeoMap.module.scss';
import type { MapCluster } from './clusterMarkers';
import type { GeoMapProps } from './types';

/**
 * 카카오맵 위에 발전소를 찍는다 (SFR-007-05~10).
 * 마커와 묶음은 `PlantMapLayer` 가 그린다 — 미니맵과 같은 겹을 나눠 써, 두 지도가 같은
 * 규칙으로 갈리고 같은 모양으로 보인다.
 */
export function KakaoGeoMap({
  plants,
  renderPopup,
  selectedId,
  onSelect,
  height = 460,
  fallback,
}: GeoMapProps) {
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  /*
    배율은 상태로 쥐고, 지도가 실제로 멈춘 값을 `onIdle` 로 되받아 적는다 —
    묶음을 다시 가르는 기준이라 지도와 어긋나면 안 된다.
  */
  const [level, setLevel] = useState(DEFAULT_LEVEL);
  const [openPlant, setOpenPlant] = useState<School | null>(null);
  const [clusterList, setClusterList] = useState<School[] | null>(null);

  const openCluster = (cluster: MapCluster<School>) => {
    if (map) fitToCluster(map, cluster.members);

    setClusterList(cluster.members.map((member) => member.data));
    setOpenPlant(null);
  };

  const pick = (plant: School) => {
    if (map) centerOn(map, plant.location);

    setOpenPlant(plant);
    onSelect?.(plant);
  };

  return (
    <div className={styles.shell}>
      <div className={styles.map} style={{ minHeight: height }}>
        <Map
          center={CENTER}
          level={level}
          // 자리를 옮길 때 뛰지 않고 미끄러지듯 간다.
          isPanto
          className={styles.kakao}
          onCreate={setMap}
          // 확대가 멈춘 뒤에만 다시 묶는다 — 그동안 마커는 지도를 따라 함께 움직인다.
          onIdle={(target) => setLevel(target.getLevel())}
        >
          <PlantMapLayer
            plants={plants}
            level={level}
            selectedId={selectedId}
            onSelect={pick}
            onOpenCluster={openCluster}
          />
        </Map>

        {clusterList ? (
          <aside className={styles.clusterList} aria-label={`이 자리 발전소 ${clusterList.length}개소`}>
            <header className={styles.clusterList__head}>
              <p className={styles.clusterList__title}>
                이 자리 발전소
                <span className={styles.clusterList__count}>{clusterList.length}</span>
              </p>
              <button
                type="button"
                className={styles.clusterList__close}
                aria-label="목록 닫기"
                onClick={() => setClusterList(null)}
              >
                <CloseIcon width={15} height={15} />
              </button>
            </header>

            <ul className={styles.clusterList__body}>
              {clusterList.map((plant) => (
                <li key={plant.id}>
                  <button
                    type="button"
                    className={styles.clusterList__item}
                    onClick={() => {
                      setClusterList(null);
                      pick(plant);
                    }}
                  >
                    <span className={cn(styles.clusterList__dot, styles[`dot--${TONE_CLASS[plant.status]}`])} />
                    <span className={styles.clusterList__name}>{plant.name}</span>
                    <span className={styles.clusterList__meta}>{plant.regionName}</span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}

        <ul className={styles.legend}>
          {(['running', 'degraded', 'fault', 'commLost'] as OperationStatus[]).map((status) => (
            <li key={status} className={styles.legend__item}>
              <span className={styles.legend__dot} style={{ backgroundColor: `var(--${TONE_CLASS[status]})` }} />
              {OPERATION_LABEL[status]}
            </li>
          ))}
        </ul>
        {/* 고른 발전소 설명은 누를 때만 지도 위로 얹힌다 (SFR-007-06~09) */}
        {openPlant ? (
          <aside className={styles.side} aria-label={`${openPlant.name} 상세`}>
            <button
              type="button"
              className={styles.side__close}
              onClick={() => setOpenPlant(null)}
              aria-label="설명 닫기"
            >
              <CloseIcon width={16} height={16} />
            </button>
            {renderPopup(openPlant)}
          </aside>
        ) : null}
      </div>

      {/* 화면에는 띄우지 않지만 스크린리더·인쇄에는 같은 내용을 남긴다 (COR-003). */}
      <div className={styles.srOnly}>{fallback}</div>
    </div>
  );
}
