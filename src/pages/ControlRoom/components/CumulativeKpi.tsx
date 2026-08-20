import { CO2_PER_KWH, CUMULATIVE, pickEnergyUnit } from '@/mocks/generation';
import { formatNumber } from '@/utils/format';
import styles from './CumulativeKpi.module.scss';

interface CumulativeKpiProps {
  /** 조회 대상의 금일·금월·금년 누적(kWh) */
  todayKwh: number;
  monthKwh: number;
  yearKwh: number;
  /** 관내 설비용량 합(kW) — 발전시간을 내는 데 쓴다 */
  capacityKw: number;
}

/** 탄소 저감량은 kg 가 금세 여섯 자리가 된다 — 1t 을 넘으면 t 으로 접는다 */
function carbonOf(kwh: number): { text: string; unit: string } {
  const kg = kwh * CO2_PER_KWH;

  return kg >= 1000
    ? { text: formatNumber(kg / 1000, 1), unit: 't' }
    : { text: formatNumber(kg), unit: 'kg' };
}

/**
 * 발전실적 (SFR-004-06/07).
 *
 * 세 기간을 같은 표에 같은 모양으로 세운다. 금일만 크게 앞세워 보았으나, 한 줄만 생김새가
 * 다르면 세로로 훑을 때 자릿수가 이어지지 않아 오히려 견주기 어렵다 — 같은 것을 묻는 줄은
 * 같은 모양이어야 한다.
 *
 * 글씨를 키우지 않는 것이 자리를 푸는 열쇠다. 앞서 큰 숫자로 세우려다 340px 칸에서 값이
 * 구분선에 닿아 붙었는데, 표 크기로 두면 세 값이 한 줄에 넉넉히 들어간다.
 */
export function CumulativeKpi({ todayKwh, monthKwh, yearKwh, capacityKw }: CumulativeKpiProps) {
  // 발전시간 = 발전량 ÷ 설비용량. 크기가 다른 기간을 같은 눈금에 세운다.
  const hoursOf = (kwh: number) => (capacityKw > 0 ? kwh / capacityKw : 0);
  const periods = [
    { key: 'today', label: '금일', kwh: todayKwh },
    { key: 'month', label: '금월', kwh: monthKwh },
    { key: 'year', label: '금년', kwh: yearKwh },
  ];
  const cumulative = carbonOf(CUMULATIVE.totalKwh);

  return (
    <div className={styles.kpi}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th />
            <th>발전량</th>
            <th>발전시간</th>
            <th>탄소저감량</th>
          </tr>
        </thead>
        <tbody>
          {periods.map((row) => {
            const energy = pickEnergyUnit(row.kwh);
            const carbon = carbonOf(row.kwh);

            return (
              <tr key={row.key}>
                <th scope="row">{row.label}</th>
                <td>
                  {formatNumber(row.kwh / energy.divider, 1)}
                  <span>{energy.unit}</span>
                </td>
                <td>
                  {formatNumber(hoursOf(row.kwh), 1)}
                  <span>h</span>
                </td>
                <td>
                  {carbon.text}
                  <span>{carbon.unit}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 가동 이후 쌓인 값 — 기간 셋과 자릿수가 달라 굵은 선으로 끊는다 */}
      <p className={styles.total}>
        <span className={styles.total__label}>누적 탄소저감량</span>
        <span className={styles.total__value}>
          {cumulative.text}
          <span className={styles.total__unit}>{cumulative.unit}</span>
        </span>
      </p>
    </div>
  );
}
