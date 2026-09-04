import { Card } from '@/components/common/Card';
import { Reveal } from '@/components/common/Reveal';
import styles from '../PlantInfo.module.scss';
import type { PlantInfoView } from '../hooks/usePlantInfoView';

/**
 * 등록 정보 — 언제 누가 무엇으로 지었는가 (SFR-016-01/02).
 *
 * 관리자 콘솔의 등록 폼에만 있던 값을 조회 쪽으로 편다. 값이 비어 있어도 줄을 지우지 않는다 —
 * 「아직 안 적혔다」 는 것도 읽어야 할 정보이고, 줄이 사라지면 어느 항목이 빠졌는지 알 수 없다.
 */
export function RegistryCard({ view }: { view: PlantInfoView }) {
  const { plant, asset, manager } = view;

  if (!plant) return null;

  return (
    <Reveal delay={0.1}>
      <Card title="등록 정보" description="발전소 대장에 적힌 값입니다. 고치는 것은 관리자 콘솔에서 합니다.">
        <dl className={styles.facts}>
          {/* 번호는 세는 값이 아니라 이름이라 천단위 쉼표를 넣지 않는다 */}
          <Fact label="발전소 번호" value={asset ? String(asset.powerPlantId) : '-'} />
          <Fact label="발전소 이름" value={asset?.plantName ?? plant.name} />
          <Fact label="구분" value={asset?.plantType ?? plant.level} />
          <Fact label="시·군" value={plant.regionName} />
          <Fact label="주소" value={`${asset?.address ?? plant.address} ${asset?.addressDetail ?? ''}`.trim()} wide />
          <Fact label="담당자" value={manager ? `${manager.name} · ${manager.phone}` : '-'} />
          <Fact label="시공 업체" value={asset ? `${asset.builder.name} · ${asset.builder.phone}` : '-'} />
          <Fact
            label="담당 업체"
            value={asset?.managerEnterprise.name
              ? `${asset.managerEnterprise.name} · ${asset.managerEnterprise.phone}`
              : '-'}
          />
          <Fact label="RTU 업체" value={asset?.rtuEntName ?? '-'} />
          <Fact label="비고" value={asset?.etc || '-'} wide />
        </dl>
      </Card>
    </Reveal>
  );
}

function Fact({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? `${styles.fact} ${styles['fact--wide']}` : styles.fact}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
