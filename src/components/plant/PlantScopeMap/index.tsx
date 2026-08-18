import { useState } from 'react';
import { MapPinIcon } from '@/components/common/Icon';
import { SCHOOLS } from '@/mocks/schools';
import { useAllowedPlantIds } from '@/hooks/useScopeClamp';
import { usePlantScope } from '@/hooks/usePlantScope';
import { useSelectNode } from '@/stores/plantStore';
import { KoreaLocator } from '@/components/plant/KoreaLocator';
import { PlantMapModal } from './PlantMapModal';
import styles from './PlantScopeMap.module.scss';

/**
 * 조회 대상 패널 맨 위의 미니 지도 (SFR-004-11).
 *
 * 좁은 컬럼에서는 점을 겨냥할 수 없어 여기서는 고르게 하지 않는다 — 지금 보고 있는 곳이
 * 나라 어디쯤인지만 보여 주고, 누르면 큰 지도를 펼쳐 거기서 고른다.
 *
 * 충남만 그려 두었을 때는 그 도형이 어디인지 아는 사람에게만 지도였다. 전국을 깔고 충남만
 * 밝히면 처음 보는 사람도 자리를 안다.
 *
 * 키보드·스크린리더는 이 버튼으로 지도를 열고, 이름으로 찾는 길은 아래 발전소 선택이 맡는다.
 */
export function PlantScopeMap() {
  const { plant } = usePlantScope();
  const selectNode = useSelectNode();
  const allowedIds = useAllowedPlantIds();
  const [isOpen, setIsOpen] = useState(false);

  // 교육기관 계정은 담당 발전소만 찍는다 (SFR-023-03).
  const marks = allowedIds.length > 0 ? SCHOOLS.filter((school) => allowedIds.includes(school.id)) : SCHOOLS;

  return (
    <div className={styles.mini}>
      <button type="button" className={styles.mini__button} onClick={() => setIsOpen(true)}>
        <span className={styles.mini__map}>
          <KoreaLocator label={`전국에서 충청남도의 자리. 관내 ${marks.length}개소를 봅니다.`} />
        </span>
        <span className={styles.mini__cta}>
          <MapPinIcon width={14} height={14} />
          지도에서 고르기
        </span>
      </button>

      <PlantMapModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        plants={marks}
        selectedId={plant?.id}
        onSelect={selectNode}
      />
    </div>
  );
}
