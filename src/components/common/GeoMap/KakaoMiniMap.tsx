import { useState } from 'react';
import { Map } from 'react-kakao-maps-sdk';
import type { School } from '@/interface/energy';
import { CENTER, centerOn, DEFAULT_LEVEL, fitToCluster } from './kakaoMarkers';
import { PlantMapLayer } from './PlantMapLayer';
import styles from './GeoMap.module.scss';
import type { MapCluster } from './clusterMarkers';

interface KakaoMiniMapProps {
  /** 이미 걸러 넘긴 발전소. 미니맵은 받은 것을 그대로 다 찍는다. */
  plants: School[];
  height: number;
  label: string;
  /** 점을 눌러 고를 수 있게 할 때만 넘긴다 */
  onPick?: (plantId: string) => void;
  selectedId?: string;
}

/**
 * 한 칸에 들어가는 작은 카카오맵 (SFR-004-01/14, SFR-004-11).
 * 확대·이동이 멈춘 뒤에만 묶음을 다시 센다 — 그동안 마커는 지도를 따라 함께 움직인다.
 */
export function KakaoMiniMap({ plants, height, label, onPick, selectedId }: KakaoMiniMapProps) {
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  /*
    배율은 상태로 쥐고, 지도가 실제로 멈춘 값을 `onIdle` 로 되받아 적는다 —
    묶음을 다시 가르는 기준이라 지도와 어긋나면 안 된다.
  */
  const [level, setLevel] = useState(DEFAULT_LEVEL);

  const openCluster = (cluster: MapCluster<School>) => {
    if (map) fitToCluster(map, cluster.members);
  };

  return (
    <div className={styles.mini} style={{ height }} role={onPick ? 'group' : 'img'} aria-label={label}>
      <Map
        center={CENTER}
        level={level}
        // 자리를 옮길 때 뛰지 않고 미끄러지듯 간다.
        isPanto
        className={styles.mini__canvas}
        onCreate={setMap}
        /*
          확대가 **멈춘 뒤에** 다시 묶는다.

          `onZoomChanged` 는 확대가 시작될 때 울린다. 그 소리에 맞춰 묶음을 다시 세면
          카카오가 지도를 부드럽게 키우는 동안 마커 전부를 지웠다 새로 붙이게 되어,
          확대가 뚝뚝 끊겨 보인다. `onIdle` 은 움직임이 끝난 뒤 한 번만 울린다.
        */
        onIdle={(target) => setLevel(target.getLevel())}
      >
        <PlantMapLayer
          plants={plants}
          level={level}
          selectedId={selectedId}
          onSelect={onPick ? (plant) => {
            if (map) centerOn(map, plant.location);

            onPick(plant.id);
          } : undefined}
          onOpenCluster={openCluster}
        />
      </Map>
    </div>
  );
}
