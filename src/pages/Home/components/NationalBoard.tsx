import { Card } from '@/components/common/Card';
import { getNationalRank, NATIONAL_AVERAGE } from '@/mocks/national';
import { Reveal } from '@/components/common/Reveal';
import { KoreaMap } from '@/components/common/KoreaMap';
import styles from './NationalBoard.module.scss';

const CHUNGNAM = 'chungnam';

/**
 * 전국 평균 발전시간 분포 지도 (SFR-006-03/04).
 * 요구사항이 "금일 재생에너지 발전 현황 정보 출력 기능"에 묶어 둔 항목이라 홈에 둔다.
 * 값은 한국에너지공단 REMS API 로 지역별 설비 데이터를 받아 평균을 낸 것으로 본다.
 */
export function NationalBoard() {
  const rank = getNationalRank(CHUNGNAM);

  return (
    <section className={styles.national} aria-labelledby="national-title">
      <Reveal>
        <Card
          title={<span id="national-title">전국 평균 발전시간</span>}
          description={`한국에너지공단 REMS 연계 값입니다. 충남은 전국 ${rank}위이고, 전국 평균은 ${NATIONAL_AVERAGE.toFixed(2)}시간입니다.`}
        >
          <KoreaMap highlight={CHUNGNAM} />
        </Card>
      </Reveal>
    </section>
  );
}
