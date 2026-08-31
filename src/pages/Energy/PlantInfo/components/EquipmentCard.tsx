import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { Reveal } from '@/components/common/Reveal';
import { formatNumber } from '@/utils/format';
import styles from '../PlantInfo.module.scss';
import type { InverterRow, PlantInfoView } from '../hooks/usePlantInfoView';

/**
 * 설비 구성 — 무엇이 몇 대 물려 있는가 (SFR-016-01, SFR-017-04~06).
 *
 * 표로 두지 않는다. 한 대가 들고 있는 값이 열 가지라 열이 그만큼 늘어나는데, 그러면 열 하나에
 * 「LX-100K-3」 같은 모델명이 두 줄로 접히고 좁은 화면에서는 절반이 잘려 나간다. 설비 하나를
 * 카드 한 장으로 세우면 값이 세로로 쌓여 잘릴 일이 없고, 대수가 몇이든 같은 판이 반복된다.
 *
 * 대신 표가 잘하던 것 — 같은 항목끼리 위아래로 견주는 일 — 은 포기한다. 이 화면이 답하려는
 * 것은 「이 인버터가 어떤 설비인가」이지 「어느 인버터가 더 큰가」가 아니라 그편이 맞는다.
 */
export function EquipmentCard({ view }: { view: PlantInfoView }) {
  const { plant, rows, totals } = view;

  if (!plant) return null;

  return (
    <Reveal delay={0.14}>
      <Card
        title="설비 구성"
        description={`인버터 ${formatNumber(rows.length)}대 · 합계 ${formatNumber(totals.capacityKw, 1)}kW · 모듈 ${formatNumber(totals.panelCount)}장`}
      >
        {rows.length === 0 ? (
          <EmptyState title="등록된 인버터가 없습니다" description="관리자 콘솔에서 설비를 먼저 등록합니다." />
        ) : (
          <ul className={styles.units}>
            {rows.map((row) => (
              <li key={row.inverter.id}>
                <InverterUnit row={row} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Reveal>
  );
}

/**
 * 인버터 한 대.
 *
 * 머리에는 눈으로 먼저 세는 것 — 상태·이름·용량 — 만 두고, 나머지 제원은 아래로 내린다.
 * 대수가 많을 때 머리줄만 훑어도 어느 대가 문제인지 걸러지게 하려는 것이다.
 */
function InverterUnit({ row }: { row: InverterRow }) {
  const { inverter, master, product, module } = row;

  return (
    <section className={styles.unit}>
      <header className={styles.unit__head}>
        <Badge tone={OPERATION_TONE[inverter.status]} withDot>
          {OPERATION_LABEL[inverter.status]}
        </Badge>
        <h3 className={styles.unit__name}>{inverter.name}</h3>
        <p className={styles.unit__capacity}>
          {formatNumber(master?.equipmentCapacity ?? inverter.capacityKw, 1)}
          <span>kW</span>
        </p>
      </header>

      <dl className={styles.unit__specs}>
        <Spec label="인버터 모델" value={product?.name ?? '-'} note={product?.maker} />
        <Spec label="모듈 모델" value={module?.name ?? '-'} note={module?.maker} />
        <Spec
          label="직병렬 구조"
          value={master ? `${master.series1}직렬 × ${master.parallel1}병렬` : '-'}
          /* MPPT 2번은 안 쓰는 설비가 대부분이다. 0×0 을 적으면 있는 회로처럼 읽힌다 */
          note={master && master.series2 > 0 ? `MPPT2 ${master.series2}직렬 × ${master.parallel2}병렬` : undefined}
        />
        <Spec label="운전 개시일" value={master?.operatedAt ?? '-'} />
        <Spec label="RTU 식별번호" value={master?.rtuCommId ?? '-'} />
        <Spec label="RTU 포트" value={master?.rtuPort == null ? '-' : `${master.rtuPort}번`} />
        <Spec label="최종 데이터 수신" value={master?.lastReceivedAt ?? '-'} wide />
      </dl>
    </section>
  );
}

function Spec({ label, value, note, wide }: { label: string; value: string; note?: string; wide?: boolean }) {
  return (
    <div className={wide ? `${styles.spec} ${styles['spec--wide']}` : styles.spec}>
      <dt>{label}</dt>
      <dd>
        {value}
        {note ? <span className={styles.sub}>{note}</span> : null}
      </dd>
    </div>
  );
}
