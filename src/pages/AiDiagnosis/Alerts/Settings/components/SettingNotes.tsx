import { Card } from '@/components/common/Card';
import { Reveal } from '@/components/common/Reveal';
import styles from '../../Alerts.module.scss';

/** 조건을 끄기 전에 알아 둘 것 */
export function SettingNotes() {
  return (
    <Reveal delay={0.08}>
      <Card title="알아 두실 점" variant="outline">
        <ul className={styles.notes}>
          <li>긴급 알림은 조건을 꺼도 시스템 화면에는 남습니다. 문자·메일 발송만 멈춥니다.</li>
          <li>수신 담당자는 시스템 관리에서 학교별로 지정합니다.</li>
          <li>여기서 바꾼 값은 저장되지 않습니다. 목업 화면입니다.</li>
        </ul>
      </Card>
    </Reveal>
  );
}
