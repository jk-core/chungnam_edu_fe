import { MODULE_SPEC } from '@/mocks/solarEdu';
import { formatPercent } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { EduStats } from '@/mocks/solarEdu';
import { delay } from './EduScenery';
import styles from './SolarEdu.module.scss';

interface EfficiencyLadderProps {
  stats: EduStats;
}

/**
 * 효율이 어디서 깎이는지 보여 주는 사다리 (SFR-005-04).
 *
 * 두 비율을 곧이곧대로 곱해 한 줄로 그리면(20.3% × 85.1% ≈ 17%) 두 번째 감소가 눈에 띄지 않는다.
 * 그래서 첫 단에서 남은 몫만 떼어 둘째 단 전체 폭으로 벌려 놓고 다시 본다 —
 * 두 단을 잇는 사다리꼴이 "이 몫만 확대했다" 는 뜻을 진다.
 *
 * SVG 가 아니라 HTML 로 짠 이유는 자리가 가로로 매우 길기 때문이다. 고정 뷰박스를 쓰면
 * 짧은 쪽에 맞춰 축소돼 폭을 절반도 못 쓴다. 여기서는 % 폭이 곧 비율이라 계산도 단순하다.
 */
export function EfficiencyLadder({ stats }: EfficiencyLadderProps) {
  const conversion = MODULE_SPEC.efficiency;

  return (
    <div className={styles.ladder}>
      <LadderRow name="햇빛 에너지" ratio={conversion} tone="brand" />
      <LadderRow name="기대 발전량" ratio={stats.pr} tone="ok" />
    </div>
  );
}

interface LadderRowProps {
  name: string;
  /** 채워지는 비율 (0~1) */
  ratio: number;
  tone: 'brand' | 'ok';
}

function LadderRow({ name, ratio, tone }: LadderRowProps) {
  return (
    <div className={styles.ladder__row}>
      <span className={styles.ladder__name}>{name}</span>

      <div className={styles.ladder__track}>
        <div
          className={cn(styles.ladder__fill, styles[`ladder__fill--${tone}`])}
          style={{ width: `${ratio * 100}%` }}
        >
          {/* 남은 몫 위를 계속 흐르는 전기 */}
          <span className={styles.ladder__spark} />
          <span className={styles.ladder__spark} style={delay(0.8)} />
          <span className={styles.ladder__spark} style={delay(1.6)} />
        </div>
        <span className={styles.ladder__value}>{formatPercent(ratio)}</span>
      </div>
    </div>
  );
}
