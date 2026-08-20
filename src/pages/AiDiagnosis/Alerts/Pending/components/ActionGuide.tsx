import { Card } from '@/components/common/Card';
import { Reveal } from '@/components/common/Reveal';
import styles from '../../Alerts.module.scss';

/** 무엇부터 손대야 하는지 (SFR-022-05) */
export function ActionGuide() {
  return (
    <Reveal delay={0.08}>
      <Card title="조치 순서" variant="outline">
        <ol className={styles.guide}>
          <li>
            <span className={styles.guide__step}>1</span>
            경과 시간이 24시간을 넘긴 긴급 건부터 확인합니다.
          </li>
          <li>
            <span className={styles.guide__step}>2</span>
            고장코드가 있으면 상세 화면에서 원인·조치 방법을 먼저 읽습니다.
          </li>
          <li>
            <span className={styles.guide__step}>3</span>
            현장 확인이 필요하면 AI진단 &gt; 점검 일정에 방문 일정을 등록합니다.
          </li>
        </ol>
      </Card>
    </Reveal>
  );
}
