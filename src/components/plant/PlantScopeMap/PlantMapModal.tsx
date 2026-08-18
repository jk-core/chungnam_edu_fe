import { useCallback, useMemo, useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { REGIONS } from '@/mocks/regions';
import { MapStatusFilter, useStatusFilter } from '@/components/plant/MapStatusFilter';
import { KakaoMiniMap } from '@/components/common/GeoMap/KakaoMiniMap';
import { Select } from '@/components/common/Select';
import { formatNumber } from '@/utils/format';
import { useKakaoMaps } from '@/hooks/useKakaoMaps';
import type { School } from '@/interface/energy';
import { PlantMapCanvas } from './PlantMapCanvas';
import styles from './PlantScopeMap.module.scss';

const ALL = 'all';

interface PlantMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  plants: School[];
  selectedId?: string;
  onSelect: (plantId: string) => void;
}

/**
 * 지도에서 발전소를 고르는 모달 (SFR-004-11).
 *
 * 사이드바 미리보기는 "지금 어디를 보고 있나"만 답한다. 자리로 학교를 찾는 일은
 * 점을 겨냥할 만큼 지도가 커야 되므로 여기서 펼친다 — 창은 화면의 아홉 할까지 쓰고,
 * 그 안에서 지도가 남는 높이를 전부 먹는다.
 *
 * 아래 닫기 줄은 두지 않는다. 머리글 오른쪽에 이미 닫기가 있어 같은 일을 두 번 내놓는 셈인데,
 * 그 한 줄이 차지하는 높이가 곧 지도에서 깎이는 높이다.
 * 시·군으로 좁히면 남는 점이 줄어 겨냥이 쉬워진다 — 128개가 한 화면에 흩어지면
 * 도시권에서는 점이 서로 겹친다.
 */
export function PlantMapModal({ isOpen, onClose, plants, selectedId, onSelect }: PlantMapModalProps) {
  const [regionCode, setRegionCode] = useState(ALL);
  const mapStatus = useKakaoMaps();

  const inRegion = useMemo(
    () => (regionCode === ALL ? plants : plants.filter((plant) => plant.regionCode === regionCode)),
    [plants, regionCode],
  );

  // 시·군으로 한 번 좁힌 뒤 상태로 한 번 더 좁힌다 — 「서산시의 경고만」 처럼 겹쳐 볼 수 있다.
  const status = useStatusFilter(inRegion);
  const shown = status.visible;

  /*
    참조가 렌더마다 바뀌면 지도가 마커를 지웠다 다시 그리기를 되풀이한다 —
    그 사이에 화면을 보면 마커가 하나도 없다.
  */
  const pick = useCallback((plantId: string) => {
    onSelect(plantId);
    onClose();
  }, [onSelect, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      title="지도에서 발전소 고르기"
      description="점을 누르면 그 발전소가 조회 대상이 됩니다. 이름으로 찾으려면 지도를 닫고 발전소 선택을 쓰세요."
    >
      <div className={styles.picker}>
        <div className={styles.picker__bar}>
          <Select
            label="시·군"
            value={regionCode}
            options={[
              { value: ALL, label: `전체 (${formatNumber(plants.length)}개소)` },
              ...REGIONS.map((region) => ({ value: region.code, label: region.name })),
            ]}
            onChange={setRegionCode}
          />
          <p className={styles.picker__note}>{formatNumber(shown.length)}개소</p>
        </div>

        {/*
          키가 있고 SDK 가 실리면 실지도를 쓰고, 그 밖에는 내장 SVG 지도로 간다 —
          시연이 외부망 상태에 걸려 멈추지 않게 하려는 것이다.
        */}
        <div className={styles.picker__stage}>
          {mapStatus === 'ready' ? (
            <KakaoMiniMap
              plants={shown}
              height="100%"
              selectedId={selectedId}
              onPick={pick}
              label={`충청남도 발전소 위치 지도. ${shown.length}개소. 점을 눌러 조회 대상을 고릅니다.`}
            />
          ) : (
            <PlantMapCanvas
              plants={shown}
              selectedId={selectedId}
              onPick={pick}
              className={styles.picker__map}
              label={`충청남도 발전소 위치 지도. ${shown.length}개소. 점을 눌러 조회 대상을 고릅니다.`}
            />
          )}
        </div>

        <MapStatusFilter
          counts={status.counts}
          picked={status.picked}
          onToggle={status.toggle}
          onReset={status.reset}
        />

        {/*
          이름은 마커 자체의 툴팁으로 띄운다.
          아래 줄에 옮겨 적으면 마우스를 올릴 때마다 화면이 다시 그려지고, 줄 높이가 오르내리며
          위 지도가 밀려 커서가 점에서 벗어난다 — 이름이 깜빡이고 지도가 떠는 원인이 된다.
        */}
        <p className={styles.picker__readout}>
          <span>점 위에 마우스를 올리면 발전소 이름과 상태가 뜹니다.</span>
        </p>
      </div>
    </Modal>
  );
}
