import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { Reveal } from '@/components/common/Reveal';
import { RTU_LABEL, RTU_TONE } from '@/mocks/status';
import { formatNumber } from '@/utils/format';
import styles from '../PlantInfo.module.scss';
import type { PlantInfoView } from '../hooks/usePlantInfoView';

/**
 * 계측 설비 — 값은 어디로 들어오는가 (SFR-016-01, SFR-017-01/02).
 *
 * 발전량이 안 올라올 때 가장 먼저 확인하는 것이 수집 경로다. RTU 와 일사량계를 나란히 세워
 * 두 상태를 한 번에 견주게 한다 — 둘 다 끊겼으면 통신 문제이고, 일사량계만 끊겼으면
 * 기대 발전량 계산만 어긋난다.
 */
export function SensorCard({ view }: { view: PlantInfoView }) {
  const { plant, rtu, pyranometer } = view;

  if (!plant) return null;

  return (
    <Reveal delay={0.18}>
      <Card title="계측 설비" description="이 발전소의 값이 올라오는 경로입니다.">
        <div className={styles.sensors}>
          <section className={styles.sensor}>
            <h3 className={styles.sensor__title}>
              RTU
              {rtu ? (
                <Badge tone={RTU_TONE[rtu.status]} withDot>
                  {RTU_LABEL[rtu.status]}
                </Badge>
              ) : null}
            </h3>

            <dl className={styles.facts}>
              <Fact label="모델" value={rtu?.model ?? '-'} />
              <Fact label="시리얼" value={rtu?.serial ?? '-'} />
              <Fact label="펌웨어" value={rtu?.firmware ?? '-'} />
              <Fact label="수집 주기" value={rtu ? `${rtu.intervalMinutes}분` : '-'} />
              <Fact label="마지막 수신" value={rtu?.lastSeenAt ?? '-'} wide />
            </dl>
          </section>

          <section className={styles.sensor}>
            <h3 className={styles.sensor__title}>
              일사량계
              {pyranometer ? (
                <Badge tone={RTU_TONE[pyranometer.status]} withDot>
                  {RTU_LABEL[pyranometer.status]}
                </Badge>
              ) : null}
            </h3>

            <dl className={styles.facts}>
              <Fact label="이름" value={pyranometer?.name ?? '-'} wide />
              {/* 번호·포트는 세는 값이 아니라 이름이라 천단위 쉼표를 넣지 않는다 */}
              <Fact label="센서 번호" value={pyranometer ? String(pyranometer.irradId) : '-'} />
              <Fact label="RTU 포트" value={pyranometer ? `${pyranometer.rtuPort}번` : '-'} />
              <Fact label="캘리브레이션" value={pyranometer ? formatNumber(pyranometer.calibrationFactor, 3) : '-'} />
              <Fact label="모듈 온도계" value={pyranometer ? (pyranometer.hasModuleThermometer ? '있음' : '없음') : '-'} />
            </dl>
          </section>
        </div>
      </Card>
    </Reveal>
  );
}

function Fact({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? `${styles.fact} ${styles['fact--wide']}` : styles.fact}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
