import { Badge } from '@/components/common/Badge';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { INVERTER_PHASE_LABEL, INVERTER_TYPE_LABEL } from '@/mocks/equipment';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { Reveal } from '@/components/common/Reveal';
import { Table } from '@/components/common/Table';
import { formatNumber } from '@/utils/format';
import type { Column } from '@/components/common/Table';
import styles from '../PlantInfo.module.scss';
import type { InverterRow, PlantInfoView } from '../hooks/usePlantInfoView';

/*
  열은 왼쪽부터 「무엇인가 → 얼마나 큰가 → 무엇으로 지었나 → 언제까지 보증되나」 순이다.
  좁은 화면에서 접히는 것은 오른쪽 셋 — 제품과 설치각은 자리를 많이 먹는 데다, 좁은 폭에서
  급히 확인할 값이 아니다.
*/
const COLUMNS: Column<InverterRow>[] = [
  {
    key: 'name',
    header: '인버터',
    render: (row) => (
      <>
        <strong>{row.inverter.name}</strong>
        <span className={styles.sub}>
          {INVERTER_TYPE_LABEL[row.inverter.type]} · {INVERTER_PHASE_LABEL[row.inverter.phase]}
        </span>
      </>
    ),
  },
  {
    key: 'capacity',
    header: '설비용량',
    width: '110px',
    align: 'right',
    render: (row) => `${formatNumber(row.inverter.capacityKw, 1)} kW`,
  },
  {
    key: 'units',
    header: '하위 설비',
    width: '110px',
    align: 'right',
    // 센트럴형은 접속반이, 스트링형은 스트링이 달린다. 형식마다 열을 갈아 끼우지 않고 한 칸에 담는다.
    render: (row) => `${formatNumber(row.unitCount)}${row.inverter.type === 'central' ? '개 접속반' : '개 스트링'}`,
  },
  {
    key: 'product',
    header: '인버터 제품',
    hideOnTablet: true,
    render: (row) => row.productLabel || '-',
  },
  {
    key: 'module',
    header: '모듈',
    hideOnTablet: true,
    render: (row) => (
      <>
        {row.moduleLabel || '-'}
        <span className={styles.sub}>
          {row.master ? `${row.master.series1}직렬 × ${row.master.parallel1}병렬 · ${formatNumber(row.panelCount)}장` : '-'}
        </span>
      </>
    ),
  },
  {
    key: 'angle',
    header: '방위 · 경사',
    width: '110px',
    align: 'right',
    hideOnTablet: true,
    render: (row) => (row.master ? `${row.master.azimuth}° · ${row.master.inclineAngle}°` : '-'),
  },
  {
    key: 'as',
    header: '운전개시 · AS 만료',
    width: '150px',
    hideOnTablet: true,
    render: (row) => (row.master ? `${row.master.operatedAt} · ${row.master.asExpiresAt}` : '-'),
  },
  {
    key: 'status',
    header: '상태',
    width: '110px',
    render: (row) => (
      <Badge tone={OPERATION_TONE[row.inverter.status]} withDot>
        {OPERATION_LABEL[row.inverter.status]}
      </Badge>
    ),
  },
];

/**
 * 설비 구성 — 무엇이 몇 대 물려 있는가 (SFR-016-01, SFR-017-04~06).
 *
 * 좌측 조회 대상 패널이 이미 같은 계층을 트리로 세우고 있어 여기서는 표로 편다. 트리는 파고드는
 * 데 좋고 표는 견주는 데 좋은데, 이 화면이 답하려는 것은 「어느 인버터가 어떻게 다른가」다.
 */
export function EquipmentCard({ view }: { view: PlantInfoView }) {
  const { plant, rows, totals } = view;

  if (!plant) return null;

  return (
    <Reveal delay={0.1}>
      <Card
        title="설비 구성"
        description={`인버터 ${formatNumber(rows.length)}대 · 합계 ${formatNumber(totals.capacityKw, 1)}kW · 모듈 ${formatNumber(totals.panelCount)}장`}
        padding="none"
      >
        {rows.length === 0 ? (
          <EmptyState title="등록된 인버터가 없습니다" description="관리자 콘솔에서 설비를 먼저 등록합니다." />
        ) : (
          <Table
            caption="인버터 구성 목록. 인버터, 설비용량, 하위 설비, 인버터 제품, 모듈, 방위·경사, 운전개시·AS 만료, 상태 순입니다."
            columns={COLUMNS}
            rows={rows}
            getRowKey={(row) => row.inverter.id}
          />
        )}
      </Card>
    </Reveal>
  );
}
