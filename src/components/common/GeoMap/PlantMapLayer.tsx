import { useMemo } from 'react';
import { CustomOverlayMap } from 'react-kakao-maps-sdk';
import { isAbnormal, OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { cn } from '@/utils/cn';
import type { School } from '@/interface/energy';
import { clusterMarkers } from './clusterMarkers';
import { CLUSTER_CELL, DEFAULT_LEVEL, TONE_CLASS } from './kakaoMarkers';
import styles from './GeoMap.module.scss';
import type { MapCluster, MapMarkerDatum } from './clusterMarkers';

interface PlantMapLayerProps {
  plants: School[];
  /** 지금 지도의 확대 단계. 이 값이 바뀌면 묶음이 다시 갈린다 */
  level: number;
  selectedId?: string | null;
  /** 단독 마커를 눌렀을 때 */
  onSelect?: (plant: School) => void;
  /** 묶음을 눌렀을 때. 안 넘기면 묶음은 읽기 전용이다 */
  onOpenCluster?: (cluster: MapCluster<School>) => void;
}

/**
 * 지도 위에 발전소를 얹는 겹 (SFR-007-05~10).
 *
 * 이름표를 단 마커는 128개가 한 화면에 뜨면 서로 겹쳐 못 읽는다. 그래서 배율에 따라 묶어,
 * 멀리서는 개수만 보이고 확대해 흩어져야 이름이 드러나게 한다.
 * 묶음 계산은 내장 SVG 지도와 같은 `clusterMarkers` 를 쓴다 — 두 지도가 같은 규칙으로 갈려야
 * 어느 쪽을 보든 읽는 법이 같다.
 */
export function PlantMapLayer({ plants, level, selectedId, onSelect, onOpenCluster }: PlantMapLayerProps) {
  const markers = useMemo<MapMarkerDatum<School>[]>(
    () => plants.map((plant) => ({
      id: plant.id,
      // 화면 좌표가 아니라 경위도를 그대로 격자에 넣는다 — 실제 위치로 묶인다.
      x: plant.location.lng,
      y: plant.location.lat,
      tone: OPERATION_TONE[plant.status],
      label: plant.name,
      data: plant,
    })),
    [plants],
  );

  /*
    카카오의 level 은 작을수록 크게 보인다 — 배율은 기본 단계에서 얼마나 좁혔는지로 센다.
    내장 SVG 지도가 쓰는 배율과 뜻이 같아야 두 지도의 묶음이 같은 자리에서 갈라진다.
  */
  const clusters = useMemo(
    () => clusterMarkers(markers, 2 ** (DEFAULT_LEVEL - level), CLUSTER_CELL),
    [markers, level],
  );

  return (
    <>
      {clusters.map((cluster) => {
        const single = cluster.members.length === 1 ? cluster.members[0] : null;
        const position = { lat: cluster.y, lng: cluster.x };

        if (single) {
          const plant = single.data;
          /*
            뾰족한 끝이 좌표를 짚도록 아래 끝을 기준점에 맞춘다 (2026-08-21 회의).
            가운데를 맞추면 이름표 높이의 절반만큼 위치가 어긋나, 어느 점이 어느 학교인지
            촘촘한 자리에서 헷갈린다.
          */
          const selected = plant.id === selectedId;
          // 이상 설비는 이름표째 상태색으로 물들고 점등된다 — 색점 하나로는 128개 사이에서 눈에 걸리지 않는다.
          const alert = isAbnormal(plant.status);

          return (
            <CustomOverlayMap key={plant.id} position={position} xAnchor={0.5} yAnchor={1} zIndex={10} clickable>
              <button
                type="button"
                className={cn(styles.pin, styles[`pin--${TONE_CLASS[plant.status]}`], {
                  [styles['pin--alert']]: alert,
                  [styles['pin--selected']]: selected,
                })}
                title={`${plant.name} · ${plant.regionName} · ${OPERATION_LABEL[plant.status]}`}
                aria-label={`${plant.name} 조회 대상으로 고르기`}
                // 마커를 탭 순서에 넣지 않는다 — 128번을 지나야 다음 칸에 닿는다.
                tabIndex={-1}
                onClick={() => onSelect?.(plant)}
              >
                {/* 색에만 기대지 않도록 고리를 하나 더 두른다 (COR-003) */}
                {alert ? <i className={styles.pin__ring} aria-hidden /> : null}
                <i className={styles.pin__dot} aria-hidden />
                <span className={styles.pin__name}>{plant.name}</span>
              </button>
            </CustomOverlayMap>
          );
        }

        const abnormal = cluster.members.filter((item) => isAbnormal(item.data.status)).length;
        const label = `발전소 ${cluster.members.length}개소 묶음${abnormal > 0 ? ` · 이상 ${abnormal}개소` : ''}`;

        return (
          <CustomOverlayMap key={cluster.id} position={position} xAnchor={0.5} yAnchor={0.5} zIndex={20} clickable>
            <button
              type="button"
              className={styles.cluster}
              title={label}
              aria-label={`${label}, 눌러서 펼치기`}
              tabIndex={-1}
              onClick={() => onOpenCluster?.(cluster)}
            >
              {cluster.members.length}
              {abnormal > 0 ? <i className={styles.cluster__flag} aria-hidden /> : null}
            </button>
          </CustomOverlayMap>
        );
      })}
    </>
  );
}
