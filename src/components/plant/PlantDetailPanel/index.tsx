import { Badge } from '@/components/common/Badge';
import { ChevronRightIcon, MapPinIcon } from '@/components/common/Icon';
import { currentOutputOf, hourlySeriesOf } from '@/mocks/schoolOutput';
import { isAbnormal, OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { Sparkline } from '@/components/common/Sparkline';
import { SUNRISE_HOUR } from '@/mocks/generation';
import { formatNumber, formatPercent } from '@/utils/format';
import type { School } from '@/interface/energy';
import styles from './PlantDetailPanel.module.scss';

interface PlantDetailPanelProps {
  plant: School;
  /** 그 발전소 화면으로 넘어간다. 안 넘기면 버튼을 두지 않는다 */
  onOpen?: () => void;
}

/**
 * 고른 발전소 설명 (SFR-007-06~09).
 *
 * 지도 위 말풍선이 아니라 옆 칸을 통째로 쓴다 — 자리가 넉넉하니 상태와 곡선만 겨우 보이던 것을
 * 주소·설비·오늘 실적까지 함께 편다. 지도를 끌어도 가려지지 않고, 다음 발전소를 눌러도
 * 같은 자리가 내용만 갈린다.
 *
 * 담는 것은 칸 높이에 맞춘다. 설치일자와 일사량계 상태까지 넣었더니 한 줄이 넘쳐 칸에 스크롤이
 * 생겼는데, 훑어보는 화면에서 굴려야 보이는 줄은 없는 것과 같다. 그 둘은 발전 현황 화면에서 본다.
 */
export function PlantDetailPanel({ plant, onOpen }: PlantDetailPanelProps) {
  const series = hourlySeriesOf(plant);
  const facts: { label: string; value: string }[] = [
    { label: '설비용량', value: `${formatNumber(plant.capacityKw, 1)} kW` },
    { label: '실시간 출력', value: `${formatNumber(currentOutputOf(plant), 1)} kW` },
    { label: '금일 발전량', value: `${formatNumber(plant.todayKwh)} kWh` },
    { label: '금월 발전량', value: `${formatNumber(plant.monthKwh)} kWh` },
    { label: '이용률', value: formatPercent(plant.utilization, 1) },
    { label: '인버터', value: `${plant.inverterCount}대` },
  ];

  return (
    <div className={styles.panel}>
      <p className={styles.name}>{plant.name}</p>

      <div className={styles.badges}>
        <Badge tone={OPERATION_TONE[plant.status]} withDot>
          {OPERATION_LABEL[plant.status]}
        </Badge>
        <Badge tone="neutral">{plant.level}</Badge>
      </div>

      <p className={styles.address}>
        <MapPinIcon width={14} height={14} aria-hidden />
        {plant.address}
      </p>

      {onOpen ? (
        <button type="button" className={styles.go} onClick={onOpen}>
          발전 현황 보기
          <ChevronRightIcon width={14} height={14} aria-hidden />
        </button>
      ) : null}

      <div>
        <p className={styles.sectionTitle}>
          시간대별 발전량 ({Math.floor(SUNRISE_HOUR)}시 ~ 20시)
        </p>
        <Sparkline
          values={series}
          tone={isAbnormal(plant.status) ? 'critical' : 'solar'}
          width={248}
          height={52}
          animate={false}
          filled
          className={styles.spark}
        />
      </div>

      <dl className={styles.facts}>
        {facts.map((fact) => (
          <div key={fact.label} className={styles.fact}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
