import { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { CHUNGNAM_REGIONS } from '@/configs/regions';
import { MapStatusFilter, useStatusFilter } from '@/components/plant/MapStatusFilter';
import { KakaoMiniMap } from '@/components/common/GeoMap/KakaoMiniMap';
import { PlantDetailPanel } from '@/components/plant/PlantDetailPanel';
import { PlantPhotos } from '@/components/plant/PlantPhotos';
import { Select } from '@/components/common/Select';
import { formatNumber } from '@/utils/format';
import { useKakaoMaps } from '@/hooks/useKakaoMaps';
import { usePlantAssets } from '@/hooks/usePlantAssets';
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
 *
 * 점을 눌러도 바로 고르지 않는다. 도시권에서는 점이 겹쳐 있어 옆 학교를 잘못 짚기 쉬운데,
 * 그대로 확정돼 창이 닫히면 무엇을 골랐는지 모른 채 조회 대상만 바뀐다. 오른쪽에 먼저 펼쳐
 * 보이고 단추를 눌러야 확정되게 해, 짚은 것과 고른 것을 가른다 — 상황판이 이상 설비를
 * 펼쳐 보이는 방식과 같다.
 */
export function PlantMapModal({ isOpen, onClose, plants, selectedId, onSelect }: PlantMapModalProps) {
  const [regionCode, setRegionCode] = useState(ALL);
  /** 눌러서 펼쳐 본 발전소. 아직 고른 것은 아니다 */
  const [previewId, setPreviewId] = useState<string | null>(null);
  const mapStatus = useKakaoMaps();
  // 사진은 등록 정보가 갖는다 — 지도가 든 `School` 에는 없다.
  const assets = usePlantAssets();

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
  const pick = useCallback((plantId: string) => setPreviewId(plantId), []);

  // 좁히는 조건이 바뀌면 펼쳐 둔 것이 지도에서 사라질 수 있다. 남아 있을 때만 편다.
  const preview = shown.find((plant) => plant.id === previewId) ?? null;

  /* 창을 닫을 때 펼쳐 둔 것도 함께 접는다 — 다시 열었을 때 지난번에 짚은 곳이 고른 것처럼 읽힌다 */
  const close = () => {
    setPreviewId(null);
    onClose();
  };

  const confirm = () => {
    if (!preview) return;

    onSelect(preview.id);
    close();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      size="full"
      title="지도에서 발전소 고르기"
      description="점을 누르면 오른쪽에 그 발전소가 펼쳐집니다. 맞으면 「이 발전소로 조회」를 누릅니다. 이름으로 찾으려면 지도를 닫고 발전소 선택을 쓰세요."
    >
      <div className={styles.picker}>
        <div className={styles.picker__bar}>
          <Select
            label="지역"
            value={regionCode}
            options={[
              { value: ALL, label: `전체 (${formatNumber(plants.length)}개소)` },
              ...CHUNGNAM_REGIONS.map((region) => ({ value: region.code, label: region.name })),
            ]}
            onChange={setRegionCode}
          />
          <p className={styles.picker__note}>{formatNumber(shown.length)}개소</p>
        </div>

        {/*
          키가 있고 SDK 가 실리면 실지도를 쓰고, 그 밖에는 내장 SVG 지도로 간다 —
          시연이 외부망 상태에 걸려 멈추지 않게 하려는 것이다.
        */}
        <div className={styles.picker__stage} data-preview={preview ? '' : undefined}>
          {mapStatus === 'ready' ? (
            <KakaoMiniMap
              plants={shown}
              height="100%"
              selectedId={preview?.id ?? selectedId}
              onPick={pick}
              label={`충청남도 발전소 위치 지도. ${shown.length}개소. 점을 눌러 발전소를 펼쳐 봅니다.`}
            />
          ) : (
            <PlantMapCanvas
              plants={shown}
              selectedId={preview?.id ?? selectedId}
              onPick={pick}
              className={styles.picker__map}
              label={`충청남도 발전소 위치 지도. ${shown.length}개소. 점을 눌러 발전소를 펼쳐 봅니다.`}
            />
          )}

          {/*
            펼쳐 본 발전소.
            자리를 늘 잡아 두지 않고 고른 뒤에만 여는 것은, 비어 있는 동안 지도가 그만큼
            좁아진 채로 겨냥해야 하기 때문이다 — 이 창이 넓은 이유가 겨냥이다.
          */}
          {preview ? (
            <aside className={styles.preview} aria-label={`${preview.name} 상세`}>
              <div className={styles.preview__body}>
                <PlantDetailPanel plant={preview} />
                <PlantPhotos
                  photos={assets.find((asset) => asset.plantId === preview.id)?.photos ?? []}
                  plantName={preview.name}
                  className={styles.preview__photos}
                />
              </div>

              <Button onClick={confirm} isFullWidth>이 발전소로 조회</Button>
            </aside>
          ) : null}
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
