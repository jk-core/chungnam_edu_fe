import { useEffect, useRef, useState } from 'react';
import { Map } from 'react-kakao-maps-sdk';
import type { School } from '@/interface/energy';
import { CENTER, centerOn, DEFAULT_LEVEL, fitToCluster, focusOn, resetView } from './kakaoMarkers';
import { PlantMapLayer } from './PlantMapLayer';
import styles from './GeoMap.module.scss';
import type { MapCluster } from './clusterMarkers';

interface KakaoMiniMapProps {
  /** 이미 걸러 넘긴 발전소. 미니맵은 받은 것을 그대로 다 찍는다. */
  plants: School[];
  /** 칸 높이. `'100%'` 처럼 CSS 길이를 주면 부모를 꽉 채운다 */
  height: number | string;
  label: string;
  /** 점을 눌러 고를 수 있게 할 때만 넘긴다 */
  onPick?: (plantId: string) => void;
  selectedId?: string;
  /**
   * 고른 곳으로 당겨서 그 하나만 보이게 할지.
   *
   * 상황판이 이상 설비를 돌아가며 펼칠 때 쓴다 — 도 전체 배율에서는 그 학교가 묶음 안에
   * 숨어, 옆에 상세를 띄워 놓고도 지도에서는 어디인지 짚어 주지 못한다.
   */
  focusSelected?: boolean;
}

/**
 * 한 칸에 들어가는 작은 카카오맵 (SFR-004-01/14, SFR-004-11).
 * 확대·이동이 멈춘 뒤에만 묶음을 다시 센다 — 그동안 마커는 지도를 따라 함께 움직인다.
 */
export function KakaoMiniMap({ plants, height, label, onPick, selectedId, focusSelected }: KakaoMiniMapProps) {
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  /*
    배율은 상태로 쥐고, 지도가 실제로 멈춘 값을 `onIdle` 로 되받아 적는다 —
    묶음을 다시 가르는 기준이라 지도와 어긋나면 안 된다.
  */
  const [level, setLevel] = useState(DEFAULT_LEVEL);

  const openCluster = (cluster: MapCluster<School>) => {
    if (map) fitToCluster(map, cluster.members);
  };

  /*
    칸이 커지면 지도에게 알린다.

    카카오 지도는 붙는 순간의 칸 크기로 타일을 깔고, 그 뒤 칸이 바뀌어도 스스로 알아채지 못한다.
    창이 열리며 칸이 자라는 자리(지도 고르기 모달)에서는 처음의 납작한 크기 그대로 남아
    화면 대부분이 빈 채로 보인다. `relayout()` 이 다시 재라는 신호이고, 그러면서 가운데가
    틀어지므로 중심을 붙잡았다 되돌려 준다.
  */
  useEffect(() => {
    const frame = frameRef.current;

    if (!map || !frame) return undefined;

    const observer = new ResizeObserver(() => {
      const center = map.getCenter();

      map.relayout();
      map.setCenter(center);
    });

    observer.observe(frame);

    return () => observer.disconnect();
  }, [map]);

  /*
    고른 곳으로 당긴다.

    배율은 지도에게 직접 시킨다. 여기서 상태를 건드리면 그 값으로 다시 그려지고 지도가 또
    움직여 서로를 밀어내는데, 지도가 멎은 뒤 `onIdle` 이 실제 배율을 되받아 적어 주므로
    묶음을 가르는 기준은 저절로 맞춰진다.
  */
  useEffect(() => {
    if (!map || !focusSelected) return undefined;

    const target = plants.find((plant) => plant.id === selectedId);

    if (!target) {
      resetView(map);

      return undefined;
    }

    // 다음 곳으로 넘어가면 가던 움직임을 거둔다 — 두 움직임이 겹치면 지도가 떨린다.
    return focusOn(map, target.location);
  }, [map, focusSelected, selectedId, plants]);

  return (
    <div ref={frameRef} className={styles.mini} style={{ height }} role={onPick ? 'group' : 'img'} aria-label={label}>
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
            /*
              당겨서 보는 지도는 고른 곳으로 스스로 미끄러져 간다 (focusOn).
              여기서 또 옮기면 두 움직임이 겹쳐 지도가 한 번 튀므로, 당기지 않는 지도에서만 옮긴다.
            */
            if (map && !focusSelected) centerOn(map, plant.location);

            onPick(plant.id);
          } : undefined}
          onOpenCluster={openCluster}
        />
      </Map>
    </div>
  );
}
