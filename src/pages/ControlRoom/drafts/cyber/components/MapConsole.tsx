import { useState } from 'react';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { formatNumber } from '@/utils/format';
import type { School } from '@/interface/energy';
import { FaultMap } from '@/pages/ControlRoom/components/FaultMap';
import { CyberPanel } from './CyberPanel';
import { RegionConsole } from './RegionConsole';
import styles from './MapConsole.module.scss';

/** 관내 발전소 현황을 그리는 두 방식 */
type MapView = 'region' | 'photo';

const MAP_VIEW_OPTIONS: { value: MapView; label: string }[] = [
  { value: 'region', label: '시·군' },
  { value: 'photo', label: '지도' },
];

/**
 * 관내 발전소 현황 (SFR-004-01/03/14).
 *
 * 담는 것은 시안 A 의 `MapPanel` 과 같다 — 두 가지로 볼 수 있다. **시·군** 은 도형만 남기고 그
 * 면적을 전부 수치의 자리로 쓰고(기본값), **지도** 는 항공사진 위에 발전소를 점으로 찍는다.
 * 걸어 두는 화면의 기본값은 시·군 쪽이다.
 *
 * 시·군 도형 지도만 이 시안의 결로 새로 짠다 (`RegionConsole`). 「지도」 보기는 카카오 항공사진
 * 연동이라 A 의 `FaultMap` 을 그대로 재사용한다 — 표시 방식을 새로 짜라는 것은 도형 지도를
 * 두고 한 말이고, 항공사진은 지도 SDK 가 그리는 것이라 시안이 손댈 표면이 아니다.
 */
export function MapConsole({ plants, abnormalCount }: { plants: School[]; abnormalCount: number }) {
  const [view, setView] = useState<MapView>('region');

  return (
    <CyberPanel
      title="관내 발전소 현황"
      note={(
        <span className={styles.tools}>
          <span className={styles.tools__count}>
            {formatNumber(plants.length)}개소 · 이상 {formatNumber(abnormalCount)}개소
          </span>
          <SegmentedControl
            label="지도 표시 방식"
            size="sm"
            options={MAP_VIEW_OPTIONS}
            value={view}
            onChange={setView}
          />
        </span>
      )}
    >
      {view === 'region'
        ? <RegionConsole plants={plants} />
        : (
          <div className={styles.photo}>
            <FaultMap plants={plants} scope="all" height="100%" selectable tour />
          </div>
        )}
    </CyberPanel>
  );
}
