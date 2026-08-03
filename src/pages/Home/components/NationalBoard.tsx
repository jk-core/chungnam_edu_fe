import { Card } from '@/components/common/Card';
import { getNationalRank, NATIONAL_AVERAGE } from '@/mocks/national';
import { Reveal } from '@/components/common/Reveal';
import { KoreaMap } from '@/components/common/KoreaMap';
import styles from './NationalBoard.module.scss';

const CHUNGNAM = 'chungnam';

/** 전국 시·도 평균 발전시간 분포 (SFR-006-03/04) */
export function NationalBoard() {
  const rank = getNationalRank(CHUNGNAM);

  return (
    <section className={styles.national} aria-labelledby="national-title">
      <Reveal>
        <Card
          eyebrow="REMS"
          title={<span id="national-title">전국 평균 발전시간</span>}
          description={`한국에너지공단 REMS 연계 값입니다. 충남은 전국 ${rank}위이고, 전국 평균은 ${NATIONAL_AVERAGE.toFixed(2)}시간입니다.`}
        >
          <KoreaMap highlight={CHUNGNAM} />
        </Card>
      </Reveal>
    </section>
  );
}
