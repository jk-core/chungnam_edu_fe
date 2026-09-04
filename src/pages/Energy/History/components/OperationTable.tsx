import { Badge } from '@/components/common/Badge';
import { RAW_STATE_LABEL } from '@/mocks/operationRaw';
import { formatNumber } from '@/utils/format';
import type { BadgeTone } from '@/components/common/Badge';
import type { OperationRaw, RawDataState } from '@/interface/operation';
import styles from './OperationTable.module.scss';

const STATE_TONE: Record<RawDataState, BadgeTone> = {
  normal: 'ok',
  missing: 'offline',
  abnormal: 'critical',
};

interface Column {
  key: keyof OperationRaw;
  header: string;
  /** 소수 자리. 정수로 보여 줄 값은 0 */
  fraction: number;
}

interface Group {
  /** 묶음 이름. 없으면 열 이름이 두 줄을 차지한다 */
  header?: string;
  columns: Column[];
}

interface OperationTableProps {
  rows: OperationRaw[];
  /** 삼상이면 선간전압·상전류가 셋으로 나뉜다 */
  threePhase: boolean;
}

/**
 * 인버터 원시 계측 표 (SFR-010-03).
 * 열이 많아 가로로 흐르므로 수집일시 열은 왼쪽에 붙여 둔다.
 * 출력전압·출력전류는 상별로 묶어 머리글을 두 줄로 세운다.
 */
export function OperationTable({ rows, threePhase }: OperationTableProps) {
  const groups = buildGroups(threePhase);
  const flat = groups.flatMap((group) => group.columns);

  return (
    <div className={styles.scroll} role="region" tabIndex={0} aria-label="운전이력 계측 표">
      <table className={styles.table}>
        <caption className={styles.srOnly}>
          수집일시별 인버터 계측값. 데이터 상태, 누적발전량, 일사량, 온도, 입력·출력 전기량 순입니다.
        </caption>
        <thead>
          <tr>
            <th scope="col" rowSpan={2} className={`${styles.head} ${styles['head--time']}`}>
              수집일시
            </th>
            {groups.map((group) => (
              group.header ? (
                <th key={group.header} scope="colgroup" colSpan={group.columns.length} className={`${styles.head} ${styles['head--group']}`}>
                  {group.header}
                </th>
              ) : (
                group.columns.map((column) => (
                  <th key={column.key} scope="col" rowSpan={2} className={styles.head}>
                    {column.header}
                  </th>
                ))
              )
            ))}
          </tr>
          <tr>
            {groups.filter((group) => group.header).flatMap((group) => group.columns).map((column) => (
              <th key={column.key} scope="col" className={`${styles.head} ${styles['head--sub']}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.at} className={row.state === 'normal' ? undefined : styles['row--flag']}>
              <th scope="row" className={styles.time}>
                {row.at}
              </th>
              {flat.map((column) => (
                <td key={column.key} className={styles.cell}>
                  {column.key === 'state' ? (
                    <Badge tone={STATE_TONE[row.state]}>{RAW_STATE_LABEL[row.state]}</Badge>
                  ) : (
                    format(row[column.key], column.fraction)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** 단상은 출력이 한 쌍, 삼상은 상별로 셋이다. */
function buildGroups(threePhase: boolean): Group[] {
  return [
    {
      columns: [
        { key: 'state', header: '데이터 상태', fraction: 0 },
        { key: 'accumWh', header: '누적발전량 (Wh)', fraction: 0 },
      ],
    },
    {
      columns: [
        { key: 'irradiance', header: '일사량 (W/㎡)', fraction: 2 },
        { key: 'moduleTemp', header: '모듈온도 (℃)', fraction: 1 },
        { key: 'inverterTemp', header: '인버터온도 (℃)', fraction: 1 },
      ],
    },
    {
      columns: [
        { key: 'dcVolt', header: '입력전압 (V)', fraction: 2 },
        { key: 'dcAmp', header: '입력전류 (A)', fraction: 2 },
        { key: 'dcWatt', header: '입력전력 (W)', fraction: 0 },
      ],
    },
    ...(threePhase
      ? [
        {
          header: '출력전압 (V)',
          columns: [
            { key: 'acVoltR' as const, header: 'R', fraction: 2 },
            { key: 'acVoltS' as const, header: 'S', fraction: 2 },
            { key: 'acVoltT' as const, header: 'T', fraction: 2 },
          ],
        },
        {
          header: '출력전류 (A)',
          columns: [
            { key: 'acAmpR' as const, header: 'R', fraction: 2 },
            { key: 'acAmpS' as const, header: 'S', fraction: 2 },
            { key: 'acAmpT' as const, header: 'T', fraction: 2 },
          ],
        },
      ]
      : [
        {
          columns: [
            { key: 'acVolt' as const, header: '출력전압 (V)', fraction: 2 },
            { key: 'acAmp' as const, header: '출력전류 (A)', fraction: 2 },
          ],
        },
      ]),
    {
      columns: [
        { key: 'acWatt', header: '출력전력 (W)', fraction: 0 },
        { key: 'frequency', header: '주파수 (Hz)', fraction: 2 },
        { key: 'powerFactor', header: '역률 (%)', fraction: 1 },
      ],
    },
  ];
}

/** 결측은 0 이 아니라 빈 값이다 — 줄표로 갈라 둔다. */
function format(value: OperationRaw[keyof OperationRaw], fraction: number): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') return formatNumber(value, fraction);

  return String(value);
}
