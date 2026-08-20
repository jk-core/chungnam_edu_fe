import { currentOutputOf } from '@/mocks/schoolOutput';
import { formatNumber } from '@/utils/format';
import { OPERATION_DESCRIPTION, OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import type { AlertRecord } from '@/interface/alert';
import type { School } from '@/interface/energy';
import styles from '../Triage.module.scss';

interface FaultCardProps {
  plant: School;
  /** 이 발전소에 떠 있는 가장 최근 경보 */
  alert?: AlertRecord;
  lastCollectedAt?: string;
}

/**
 * 이상 설비 한 장.
 *
 * 이름과 상태만 적으면 목록이지 카드가 아니다. 조치하러 가는 사람이 묻는 것 — 어디인가,
 * 얼마나 못 내고 있나, 마지막으로 값이 언제 들어왔나, 무슨 경보가 떠 있나 — 를 한 장에 담는다.
 */
export function FaultCard({ plant, alert, lastCollectedAt }: FaultCardProps) {
  const output = currentOutputOf(plant);
  // 설비용량 대비 지금 얼마나 내고 있는지. 떨어진 폭이 곧 급함의 크기다.
  const ratio = plant.capacityKw > 0 ? Math.max(0, Math.min(1, output / plant.capacityKw)) : 0;

  return (
    <li className={styles.card} data-tone={OPERATION_TONE[plant.status]}>
      <header className={styles.card__head}>
        <h3 className={styles.card__name}>{plant.name}</h3>
        <span className={styles.card__state}>{OPERATION_LABEL[plant.status]}</span>
      </header>

      <p className={styles.card__where}>{plant.regionName} · 인버터 {formatNumber(plant.inverterCount)}대</p>

      <p className={styles.card__output}>
        <strong>{formatNumber(output, 1)}</strong>
        <span>kW / {formatNumber(plant.capacityKw, 1)}kW</span>
      </p>

      <div className={styles.card__bar} role="img" aria-label={`설비용량 대비 ${Math.round(ratio * 100)}퍼센트`}>
        <span style={{ inlineSize: `${(ratio * 100).toFixed(1)}%` }} />
      </div>

      <p className={styles.card__why}>{alert?.title ?? OPERATION_DESCRIPTION[plant.status]}</p>

      <footer className={styles.card__foot}>
        {alert ? <span>{alert.occurredAt.slice(5, 16)} 발생</span> : null}
        {lastCollectedAt ? <span>최근 수집 {lastCollectedAt.slice(11, 16)}</span> : null}
      </footer>
    </li>
  );
}
