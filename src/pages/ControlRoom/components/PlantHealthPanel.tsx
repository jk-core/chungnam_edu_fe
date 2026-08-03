import { Badge } from '@/components/common/Badge';
import { getFaultCode, getInvertersOf } from '@/mocks/equipment';
import { getRawSeries, INTERVAL_MINUTES } from '@/mocks/collection';
import { isAbnormal, OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { NOW_HOUR, TODAY } from '@/mocks/today';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import type { School } from '@/interface/energy';
import styles from './PlantHealthPanel.module.scss';

/** 한 칸이 덮는 시간 — 15분 간격 96칸이 하루가 된다. */
const SLOTS_PER_HOUR = 60 / INTERVAL_MINUTES;

interface PlantHealthPanelProps {
  plant: School;
}

/**
 * 발전소 하나를 볼 때의 수집·고장 현황 (SFR-004-04/05).
 * 전체 보기에서는 지도가 "어디가 아픈지"를 답하지만, 한 곳만 볼 때는 지도가 의미가 없다.
 * 대신 "값이 제대로 들어오고 있는지"와 "지금 무엇이 문제인지"를 답한다.
 */
export function PlantHealthPanel({ plant }: PlantHealthPanelProps) {
  const points = getRawSeries(plant.id, TODAY.toDate());
  // 아직 오지 않은 시간대는 결측이 아니라 '예정' 이다. 지나간 칸만 판정한다.
  const passed = Math.round(NOW_HOUR * SLOTS_PER_HOUR);
  const missing = points.filter((point, index) => index < passed && point.values.power === null).length;
  const receivedRate = passed > 0 ? (passed - missing) / passed : 1;

  // 이상이 있는 인버터의 고장코드를 모아 원인·조치를 함께 보여 준다.
  const faults = getInvertersOf(plant.id)
    .filter((inverter) => isAbnormal(inverter.status))
    .map((inverter) => ({ inverter, fault: getFaultCode(inverter.faultCode) }));

  return (
    <div className={styles.health}>
      <div className={styles.summary}>
        <span className={styles.summary__stat}>
          <span className={styles.summary__label}>오늘 수집률</span>
          <span className={cn(styles.summary__value, { [styles['summary__value--warn']]: receivedRate < 0.95 })}>
            {formatNumber(receivedRate * 100, 1)}
            <span className={styles.summary__unit}>%</span>
          </span>
        </span>
        <span className={styles.summary__stat}>
          <span className={styles.summary__label}>미수신 구간</span>
          <span className={cn(styles.summary__value, { [styles['summary__value--warn']]: missing > 0 })}>
            {formatNumber(missing)}
            <span className={styles.summary__unit}>칸</span>
          </span>
        </span>
        <Badge tone={OPERATION_TONE[plant.status]} withDot>
          {OPERATION_LABEL[plant.status]}
        </Badge>
      </div>

      {/* 15분 96칸 — 값이 빈 시간대가 어디였는지 하루를 한 줄로 편다 */}
      <div className={styles.timeline}>
        <div
          className={styles.timeline__track}
          role="img"
          aria-label={`오늘 15분 단위 수집 상태. ${passed}칸 중 ${missing}칸 미수신.`}
        >
          {points.map((point, index) => (
            <span
              key={point.time}
              className={cn(styles.slot, {
                [styles['slot--future']]: index >= passed,
                [styles['slot--missing']]: index < passed && point.values.power === null,
              })}
              title={`${point.time} · ${point.values.power === null ? '미수신' : '정상'}`}
            />
          ))}
        </div>
        <p className={styles.timeline__axis}>
          <span>00시</span>
          <span>06시</span>
          <span>12시</span>
          <span>18시</span>
          <span>24시</span>
        </p>
      </div>

      {/* 지금 걸려 있는 고장 — 코드와 첫 조치만 짧게 */}
      <div className={styles.faults}>
        {faults.length === 0 ? (
          <p className={styles.faults__empty}>지금 이 발전소에 검출된 고장은 없습니다.</p>
        ) : (
          faults.map(({ inverter, fault }) => (
            <div key={inverter.id} className={styles.fault}>
              <p className={styles.fault__head}>
                <Badge tone={OPERATION_TONE[inverter.status]} withDot>
                  {OPERATION_LABEL[inverter.status]}
                </Badge>
                <span className={styles.fault__name}>{inverter.name}</span>
                {fault ? <span className={styles.fault__code}>{fault.code}</span> : null}
              </p>
              <p className={styles.fault__label}>{fault ? fault.label : '진단 효율 저하'}</p>
              <p className={styles.fault__action}>
                {fault ? fault.actions[0] : '현장에서 계측값과 결선 상태를 확인하세요.'}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
