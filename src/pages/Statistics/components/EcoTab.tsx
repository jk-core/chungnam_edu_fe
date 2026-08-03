import { motion } from 'motion/react';
import { CUMULATIVE } from '@/mocks/generation';
import { Card } from '@/components/common/Card';
import { LeafIcon } from '@/components/common/Icon';
import { Reveal } from '@/components/common/Reveal';
import { StatCard } from '@/components/common/StatCard';
import { formatCarbon, formatEnergy, formatNumber } from '@/utils/format';
import { usePlantScope } from '@/hooks/usePlantScope';
import styles from '../Statistics.module.scss';

const GLYPH_COUNT = 60;
const GLYPHS = Array.from({ length: GLYPH_COUNT }, (_, index) => index);

const toNumber = (value: string) => Number(value.replace(/,/g, ''));

export function EcoTab() {
  const { label, factor } = usePlantScope();
  const totalKwh = CUMULATIVE.totalKwh * factor;
  const co2SavedKg = CUMULATIVE.co2SavedKg * factor;
  const pineTrees = Math.round(CUMULATIVE.pineTrees * factor);
  const households = Math.round(CUMULATIVE.households * factor);

  const carbon = formatCarbon(co2SavedKg);
  const total = formatEnergy(totalKwh);
  // 나무 한 그루 글리프가 대표하는 실제 그루 수
  const treesPerGlyph = Math.max(1, Math.round(pineTrees / GLYPH_COUNT));

  return (
    <div className={styles.tab}>
      <div className={styles.grid3}>
        <Reveal>
          <StatCard
            label="누적 발전량"
            value={toNumber(total.value)}
            unit={total.unit}
            fractionDigits={2}
            accent
          />
        </Reveal>
        <Reveal delay={0.06}>
          <StatCard
            label="온실가스 저감"
            value={toNumber(carbon.value)}
            unit={`${carbon.unit}CO₂`}
            fractionDigits={1}
            icon={<LeafIcon />}
          />
        </Reveal>
        <Reveal delay={0.12}>
          <StatCard label="가구 사용량 환산" value={households} unit="가구·년" />
        </Reveal>
      </div>

      <Reveal delay={0.08}>
        <Card
          eyebrow="Equivalent"
          title="소나무로 환산하면"
          description={`${label}이(가) 저감한 온실가스는 30년생 소나무 ${formatNumber(pineTrees)}그루가 1년 동안 흡수하는 양과 같습니다.`}
        >
          <div className={styles.forest} aria-hidden="true">
            {GLYPHS.map((index) => (
              <motion.svg
                key={index}
                viewBox="0 0 16 24"
                className={styles.forest__tree}
                initial={{ opacity: 0, y: 8, scale: 0.86 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.36, delay: index * 0.012, ease: 'easeOut' }}
              >
                <path d="M8 1 2.6 11h10.8L8 1Z" />
                <path d="M8 7.5 1.6 19h12.8L8 7.5Z" />
                <rect x="7" y="18" width="2" height="5" rx="0.8" className={styles.forest__trunk} />
              </motion.svg>
            ))}
          </div>
          <p className={styles.forest__caption}>나무 한 그루가 {formatNumber(treesPerGlyph)}그루를 나타냅니다.</p>
        </Card>
      </Reveal>

      <Reveal delay={0.14}>
        <Card eyebrow="Method" title="산정 기준" variant="outline">
          <dl className={styles.method}>
            <div>
              <dt>온실가스 배출계수</dt>
              <dd>0.4594 kgCO₂/kWh — 2024년 국가 전력 배출계수</dd>
            </div>
            <div>
              <dt>소나무 흡수량</dt>
              <dd>6.6 kgCO₂/그루·년 — 30년생 소나무 기준</dd>
            </div>
            <div>
              <dt>가구 사용량</dt>
              <dd>350 kWh/월 — 4인 가구 평균</dd>
            </div>
          </dl>
        </Card>
      </Reveal>
    </div>
  );
}
