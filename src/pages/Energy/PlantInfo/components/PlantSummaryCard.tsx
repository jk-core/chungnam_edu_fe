import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/common/Card';
import { GeoMap } from '@/components/common/GeoMap';
import { PATH } from '@/routes/routes';
import { PlantDetailPanel } from '@/components/plant/PlantDetailPanel';
import { Reveal } from '@/components/common/Reveal';
import styles from '../PlantInfo.module.scss';
import type { PlantInfoView } from '../hooks/usePlantInfoView';

/**
 * 한눈에 — 지금 어떤 발전소를 보고 있는가.
 *
 * 설명 패널은 상황판이 지도 옆에 세우던 것을 그대로 가져온다. 같은 발전소를 두 화면에서
 * 서로 다른 모양으로 소개하면 같은 곳인 줄 알아보지 못한다.
 *
 * 그 옆에 지도를 세우는 것은 주소 한 줄로는 「어디인가」가 읽히지 않기 때문이다. 미니맵이 아니라
 * `GeoMap` 을 쓰는 것은 그쪽이 카카오 SDK 가 안 실릴 때 내장 SVG 지도로 스스로 갈아타기
 * 때문이다 — 미니맵은 그 분기를 부르는 쪽에 맡겨 두어, 키가 없는 환경에서는 빈 상자만 남는다.
 */
export function PlantSummaryCard({ view }: { view: PlantInfoView }) {
  const navigate = useNavigate();
  const { plant } = view;

  if (!plant) return null;

  return (
    <Reveal>
      <Card title="한눈에" description="이 발전소가 지금 어떤 상태이고 어디에 있는지 봅니다.">
        <div className={styles.summary}>
          <PlantDetailPanel plant={plant} onOpen={() => navigate(PATH.ENERGY_STATISTICS)} />

          <div className={styles.summary__map}>
            <GeoMap
              plants={[plant]}
              selectedId={plant.id}
              height={300}
              renderPopup={(item) => (
                <>
                  <strong>{item.name}</strong>
                  <span className={styles.sub}>{item.address}</span>
                </>
              )}
              fallback={`${plant.name} · ${plant.address}`}
            />
          </div>
        </div>
      </Card>
    </Reveal>
  );
}
