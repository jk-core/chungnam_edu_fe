import { Badge } from '@/components/common/Badge';
import { DATA_STATE } from '@/configs/codes';
import { formatNumber } from '@/utils/format';
import type { DataStateCode } from '@/configs/codes';
import type { OperationHistoryPage } from '@/service/operationHistory/type';
import styles from './OperationTable.module.scss';

/** 계측값 열 — 숫자만 온다. 데이터 상태는 뱃지라 따로 세운다 */
interface Column {
  key: keyof OperationHistoryPage;
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
  rows: OperationHistoryPage[];
  /** 삼상이면 출력전압·출력전류가 상별로 셋이다 */
  threePhase: boolean;
}

/**
 * 수집 데이터 상태. 문구는 서버가 준 이름을 그대로 쓰고 색만 셋으로 접는다 —
 * 값이 안 온 것(미수신)과 값이 이상한 것을 가른다.
 */
function DataStateBadge({ code, name }: { code: DataStateCode; name: string }) {
  if (code === DATA_STATE.CODE.정상) return <Badge tone="ok">{name}</Badge>;

  if (code === DATA_STATE.CODE['TIME-OUT']
    || code === DATA_STATE.CODE.프로토콜에러
    || code === DATA_STATE.CODE['누적값 없음(NULL)']) {
    return <Badge tone="offline">{name}</Badge>;
  }

  return <Badge tone="caution">{name}</Badge>;
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
            <th scope="col" rowSpan={2} className={styles.head}>
              데이터 상태
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
            <tr key={row.gathDtm} className={row.dataStateCode === DATA_STATE.CODE.정상 ? undefined : styles['row--flag']}>
              <th scope="row" className={styles.time}>
                {row.gathDtm}
              </th>
              <td className={styles.cell}>
                <DataStateBadge code={row.dataStateCode} name={row.dataStateName} />
              </td>
              {flat.map((column) => (
                <td key={column.key} className={styles.cell}>
                  {format(row[column.key], column.fraction)}
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
        { key: 'accumPower', header: '누적발전량 (Wh)', fraction: 0 },
        { key: 'irrad', header: '일사량 (W/㎡)', fraction: 2 },
        { key: 'moduleTemp', header: '모듈온도 (℃)', fraction: 1 },
        { key: 'inverterTemp', header: '인버터온도 (℃)', fraction: 1 },
        { key: 'inputVoltageFigure', header: '입력전압 (V)', fraction: 2 },
        { key: 'inputCurrentFigure', header: '입력전류 (A)', fraction: 2 },
        { key: 'inputPowerFigure', header: '입력전력 (W)', fraction: 0 },
      ],
    },
    ...(threePhase
      ? [
        {
          header: '출력전압 (V)',
          columns: [
            { key: 'sysRPhaseVoltage' as const, header: 'R', fraction: 2 },
            { key: 'sysSPhaseVoltage' as const, header: 'S', fraction: 2 },
            { key: 'sysTPhaseVoltage' as const, header: 'T', fraction: 2 },
          ],
        },
        {
          header: '출력전류 (A)',
          columns: [
            { key: 'sysRPhaseCurrent' as const, header: 'R', fraction: 2 },
            { key: 'sysSPhaseCurrent' as const, header: 'S', fraction: 2 },
            { key: 'sysTPhaseCurrent' as const, header: 'T', fraction: 2 },
          ],
        },
      ]
      : [
        {
          columns: [
            { key: 'outputVoltageFigure' as const, header: '출력전압 (V)', fraction: 2 },
            { key: 'outputCurrentFigure' as const, header: '출력전류 (A)', fraction: 2 },
          ],
        },
      ]),
    {
      columns: [
        { key: 'outputPowerFigure', header: '출력전력 (W)', fraction: 0 },
        { key: 'frequency', header: '주파수 (Hz)', fraction: 2 },
        { key: 'powerFactorRate', header: '역률 (%)', fraction: 1 },
      ],
    },
  ];
}

/** 결측은 0 이 아니라 빈 값이다 — 줄표로 갈라 둔다. */
function format(value: OperationHistoryPage[keyof OperationHistoryPage], fraction: number): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') return formatNumber(value, fraction);

  return String(value);
}
