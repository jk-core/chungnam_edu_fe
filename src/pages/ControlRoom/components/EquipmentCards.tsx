import { Badge } from '@/components/common/Badge';
import { getDiagnosisUnits, getInvertersOf, INVERTER_TYPE_LABEL } from '@/mocks/equipment';
import { isAbnormal, OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { Sparkline } from '@/components/common/Sparkline';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import { hourlySeriesOf } from '@/mocks/schoolOutput';
import { useAutoPager } from '@/hooks/useAutoPager';
import type { School } from '@/interface/energy';
import { PagerBar } from './PagerBar';
import styles from './EquipmentCards.module.scss';

/** 한 쪽이 머무는 시간 — 카드 하나를 훑을 만큼은 준다 */
const PAGE_MS = 8000;

/** 이 아래로 떨어진 발전시간은 짚어 준다 (맑은 날 정상 설비가 4시간 안팎) */
const LOW_HOURS = 3;

interface EquipmentCardsProps {
  plant: School;
}

/**
 * 단일 발전소를 볼 때의 설비 현황 (SFR-004-03).
 * 발전소 하나를 골라 두면 다른 학교와 견줄 일이 없으므로, 표 대신
 * 인버터 카드로 내려가 그 아래 스트링·접속반 상태를 함께 편다.
 */
export function EquipmentCards({ plant }: EquipmentCardsProps) {
  const inverters = getInvertersOf(plant.id);
  // 발전소 시간대 곡선을 인버터 수로 나눠 카드마다 같은 모양의 흐름을 얹는다.
  const shape = hourlySeriesOf(plant);

  // 카드가 칸을 넘치면 스크롤 대신 쪽을 넘긴다 — 벽면 모니터에는 굴려 줄 사람이 없다.
  const { frameRef, itemRef, from, to, page, pageCount, turnKey } = useAutoPager<
    HTMLDivElement,
    HTMLElement
  >({ total: inverters.length, intervalMs: PAGE_MS });

  const visible = inverters.slice(from, to);

  if (inverters.length === 0) {
    return <p className={styles.empty}>{plant.name}에 등록된 인버터가 없습니다.</p>;
  }

  return (
    <div className={styles.wrap}>
      <div
        ref={frameRef}
        className={styles.cards}
      >
        {visible.map((inverter, index) => {
          const units = getDiagnosisUnits(inverter);
          const abnormalUnits = units.filter((unit) => isAbnormal(unit.status)).length;
          const share = plant.capacityKw > 0 ? inverter.capacityKw / plant.capacityKw : 0;

          return (
            <article
              key={inverter.id}
              ref={index === 0 ? itemRef : undefined}
              className={cn(styles.card, { [styles['card--abnormal']]: isAbnormal(inverter.status) })}
            >
              <header className={styles.card__head}>
                <span className={styles.card__title}>
                  <span className={styles.card__name}>{inverter.name}</span>
                  <span className={styles.card__type}>{INVERTER_TYPE_LABEL[inverter.type]}</span>
                </span>
                <Badge tone={OPERATION_TONE[inverter.status]} withDot>
                  {OPERATION_LABEL[inverter.status]}
                </Badge>
              </header>

              <dl className={styles.card__figures}>
                <div>
                  <dt>설비용량</dt>
                  <dd>
                    {formatNumber(inverter.capacityKw, 1)}
                    <span className={styles.card__unit}>kW</span>
                  </dd>
                </div>
                <div>
                  <dt>금일 발전량</dt>
                  <dd>
                    {formatNumber(plant.todayKwh * share)}
                    <span className={styles.card__unit}>kWh</span>
                  </dd>
                </div>
                <div>
                  <dt>발전시간</dt>
                  <dd className={inverter.hoursTrend[6] < LOW_HOURS ? styles.card__warn : undefined}>
                    {formatNumber(inverter.hoursTrend[6] ?? 0, 1)}
                    <span className={styles.card__unit}>h</span>
                  </dd>
                </div>
              </dl>

              <Sparkline
                values={shape.map((value) => value * share)}
                tone={isAbnormal(inverter.status) ? 'critical' : 'solar'}
                width={240}
                height={34}
                filled
              />

              {/* 인버터 타입에 따라 스트링 또는 접속반이 최말단이다 */}
              <div className={styles.units}>
                <p className={styles.units__head}>
                  {inverter.type === 'central' ? '접속반' : '스트링'} {units.length}
                  {abnormalUnits > 0 ? <span className={styles.units__alert}>이상 {abnormalUnits}</span> : null}
                </p>
                <ul className={styles.units__list}>
                  {units.map((unit) => (
                    <li
                      key={unit.id}
                      className={cn(styles.unit, styles[`unit--${OPERATION_TONE[unit.status]}`])}
                      title={`${unit.name} · ${OPERATION_LABEL[unit.status]} · ${formatNumber(unit.capacityKw, 1)}kW`}
                    >
                      <span className={styles.unit__name}>{unit.name}</span>
                      <span className={styles.unit__status}>{OPERATION_LABEL[unit.status]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>

      <PagerBar
        page={page}
        pageCount={pageCount}
        turnKey={turnKey}
        intervalMs={PAGE_MS}
        total={inverters.length}
      />
    </div>
  );
}
