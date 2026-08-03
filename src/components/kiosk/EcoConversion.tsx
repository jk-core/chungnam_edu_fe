import { CountUp } from '@/components/common/CountUp';
import { formatNumber } from '@/utils/format';
import { kwhToCarbon, kwhToHouseholdDays, kwhToTrees } from '@/utils/eco';
import styles from './Kiosk.module.scss';

interface EcoConversionProps {
  generationKwh: number;
}

/** 발전량을 전기사용량·탄소저감량·나무로 환산해 보여 준다 (SFR-005-03). */
export function EcoConversion({ generationKwh }: EcoConversionProps) {
  const carbonKg = kwhToCarbon(generationKwh);
  const useTon = carbonKg >= 1000;
  const carbonValue = useTon ? carbonKg / 1000 : carbonKg;

  const cards = [
    {
      label: '줄인 이산화탄소',
      value: carbonValue,
      digits: useTon ? 1 : 0,
      unit: useTon ? 't' : 'kg',
      note: '화력발전소가 그만큼 덜 돌았어요.',
    },
    {
      label: '나무를 심은 효과',
      value: kwhToTrees(generationKwh),
      digits: 0,
      unit: '그루',
      note: '소나무 한 그루가 1년 동안 마시는 양으로 셈했어요.',
    },
    {
      label: '네 식구가 쓸 수 있는 하루',
      value: kwhToHouseholdDays(generationKwh),
      digits: 0,
      unit: '집',
      note: `한 집이 하루에 쓰는 전기를 기준으로 했어요. (${formatNumber(generationKwh)}kWh)`,
    },
  ];

  return (
    <div className={styles.eco}>
      {cards.map((card) => (
        <div key={card.label} className={styles.ecoCard}>
          <p className={styles.ecoCard__label}>{card.label}</p>
          <p className={styles.ecoCard__value}>
            {/* 키오스크는 스크롤이 없으므로 화면에 뜨는 즉시 센다. */}
            <CountUp value={card.value} fractionDigits={card.digits} startOnView={false} />
            <span className={styles.ecoCard__unit}>{card.unit}</span>
          </p>
          <p className={styles.ecoCard__note}>{card.note}</p>
        </div>
      ))}
    </div>
  );
}
