import { useState } from 'react';
import type { ControlRoomData } from '@/pages/ControlRoom/useControlRoomData';
import styles from '../Terrain.module.scss';
import { AggregationCell } from './AggregationCell';
import { RegionDetail } from './RegionDetail';
import { RegionMap } from './RegionMap';

/** 큰 자리의 주인 — 지도이거나 집계표다 */
type BigPanel = 'map' | 'table';

/** 지도 보기 — 실제 카카오 지도이거나 시·군 도형 지도다 */
export type MapView = 'kakao' | 'shape';

/**
 * 시안 B 의 배치와 자리바꿈 (고객 요청 2026-09-14).
 *
 * 큰 자리(왼쪽 위)·상세(오른쪽)·작은 자리(아래 띠) 셋으로 나눈다. 평소에는 지도가 큰 자리를
 * 쓰고 집계표가 아래 작은 띠에 눕는다. 작은 자리의 판에 선 「크게 보기」 를 누르면 그 판이 큰
 * 자리로 오고 지도가 작은 띠로 내려간다 — 두 판 모두 큰·작은 자리 양쪽에서 말이 되게 짜여 있어
 * (variant), 자리만 맞바꾸면 된다.
 *
 * 자리바꿈은 배치 상태라 이 컨테이너가 쥔다 — index 는 이 판 하나를 끼우기만 한다. 상세는
 * 늘 오른쪽에 남아, 지도든 집계표든 큰 자리에 선 것과 나란히 읽힌다.
 */
export function TerrainBoard({ data }: { data: ControlRoomData }) {
  const [big, setBig] = useState<BigPanel>('map');
  /*
    지도 보기는 여기서 한 벌만 쥔다. 지도가 큰 자리↔작은 띠를 오가며 다시 마운트돼도, 또
    「무엇을 볼지(보기)」 와 「어디에 둘지(자리)」 가 뒤섞이지 않도록 위에서 내려 준다.
    고른 시·군과 순회는 모듈 저장소(useRegionTour)가 쥐므로 보기를 바꿔도 그대로 유지된다.
  */
  const [mapView, setMapView] = useState<MapView>('kakao');
  const mapIsBig = big === 'map';

  return (
    <div className={styles.board} data-big={big}>
      <div className={styles.cell} style={{ gridArea: 'big' }}>
        {mapIsBig ? (
          <RegionMap plants={data.rows} variant="big" mapView={mapView} onMapView={setMapView} />
        ) : (
          <AggregationCell plants={data.rows} variant="big" />
        )}
      </div>

      <div className={styles.cell} style={{ gridArea: 'detail' }}>
        <RegionDetail plants={data.rows} />
      </div>

      <div className={styles.cell} style={{ gridArea: 'small' }}>
        {mapIsBig ? (
          <AggregationCell plants={data.rows} variant="small" onExpand={() => setBig('table')} />
        ) : (
          <RegionMap
            plants={data.rows}
            variant="small"
            mapView={mapView}
            onMapView={setMapView}
            onExpand={() => setBig('map')}
          />
        )}
      </div>
    </div>
  );
}
