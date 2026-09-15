import { formatNumber, scaleSi } from '@/utils/format';
import type { School } from '@/interface/energy';
import styles from './ProvinceBoard.module.scss';

/**
 * 충남 전체 — 제 박스로 선 도 단위 요약.
 *
 * 본디 시·군 상세 칸 아래에 덧붙여 두었다. 지금 보는 시·군 바로 밑에 같은 여섯 값이 서서 견주기는
 * 좋았지만, 덧붙인 만큼 그 칸의 키가 730px 까지 자라 **지도 판을 화면 높이만큼 세울 수밖에**
 * 없었다. 지도가 높아지면 옆 칸도 따라 높아지고, 남는 자리를 메우려 또 무언가를 밀어 넣는
 * 돌림이 생긴다. 박스를 갈라 내면 상세 칸이 545px 로 돌아오고 지도 판도 제 키를 찾는다.
 *
 * 가른 김에 큰 숫자 띠와 합쳤다. 띠는 「현재 출력·금일 발전량·정상 가동·조치 대상」 을, 이 박스는
 * 「개소·설비용량·실시간 출력·금일 발전량·발전시간·이용률」 을 말하고 있어 값이 겹쳤다 —
 * 같은 화면에서 같은 수를 두 번 크게 적을 까닭이 없다. 여섯 칸 한 줄로 합쳐 도 전체가 한 자리에서
 * 끝나게 한다.
 *
 * 값 아래에 보조 한 줄(「가동률 84.6%」 따위)을 달아 두었으나 걷어냈다. 12px 로는 벽에서 읽히지
 * 않는데, 읽히게 키우면 여섯 칸이 두 줄로 접혀 박스가 그만큼 높아진다 — 읽지도 못할 글이 자리만
 * 먹는 셈이었다. 뺀 자리는 큰 숫자가 받는다.
 */

interface Totals {
  outputKw: number;
  capacityKw: number;
  todayKwh: number;
  monthKwh: number;
  yearKwh: number;
}

interface ProvinceBoardProps {
  plants: School[];
  totals: Totals;
  abnormalCount: number;
}

export function ProvinceBoard({ plants, totals, abnormalCount }: ProvinceBoardProps) {
  const output = scaleSi(totals.outputKw, 'W');
  const today = scaleSi(totals.todayKwh, 'Wh');
  const capacity = scaleSi(totals.capacityKw, 'W');
  const running = plants.length - abnormalCount;
  // 금일 발전시간 = 금일 발전량 ÷ 설비용량. 시·군 상세 칸이 쓰는 셈과 같아야 두 값을 견줄 수 있다.
  const hours = totals.capacityKw > 0 ? totals.todayKwh / totals.capacityKw : 0;

  const cells = [
    {
      key: 'count',
      label: '정상 가동',
      value: formatNumber(running),
      unit: `/ ${formatNumber(plants.length)}개소`,
      tone: 'ok' as const,
    },
    {
      key: 'abnormal',
      label: '조치 대상',
      value: formatNumber(abnormalCount),
      unit: '개소',
      tone: abnormalCount > 0 ? ('critical' as const) : ('ok' as const),
    },
    {
      key: 'capacity',
      label: '설비용량',
      value: formatNumber(capacity.amount, capacity.fractionDigits),
      unit: capacity.unit,
    },
    {
      key: 'output',
      label: '실시간 출력',
      value: formatNumber(output.amount, output.fractionDigits),
      unit: output.unit,
    },
    {
      key: 'today',
      label: '금일 발전량',
      value: formatNumber(today.amount, today.fractionDigits),
      unit: today.unit,
    },
    /*
      이용률 자리에 발전시간을 둔다.

      이용률은 「지금 이 순간」 을 재는 값이라 바로 왼쪽의 실시간 출력과 같은 것을 두 번 말한다 —
      출력 ÷ 설비용량이 곧 이용률이다. 발전시간은 하루치가 쌓인 값이라 금일 발전량과 짝이 되고,
      큰 시·군과 작은 시·군을 같은 눈금에 세우는 잣대이기도 하다.

      이름은 아래 시·군 상세 칸이 쓰는 말을 그대로 쓴다 — 같은 값이 두 자리에서 다른 이름으로
      불리면 도 전체와 시·군을 견줄 때 그것부터 맞춰 봐야 한다.
    */
    {
      key: 'hours',
      label: '발전시간',
      value: formatNumber(hours, 1),
      unit: 'h',
    },
  ];

  /*
    판 제목 줄을 따로 두지 않는다.

    다른 판처럼 제목을 한 줄 얹으면 박스가 46px 더 자라는데, 이 박스는 화면 폭을 가로지르므로
    그 46px 이 아래 판들에서 그대로 깎인다(그 탓에 실적 표가 31px 잘렸다). 이름은 왼쪽 끝에
    세워 첫 값 옆에 붙인다 — 한 줄 안에서 「충남 전체 · 정상 가동 269」 로 이어 읽힌다.
  */
  return (
    <section className={styles.board} aria-label="충남 전체 요약">
      {/*
        이름은 값 위에 한 줄로 눕힌다.

        왼쪽에 세로로 세워 두었을 때는 이름 한 덩이가 칸 하나를 통째로 차지하면서도 위아래가
        비어, 값들과 다른 결로 떠 보였다. 두 줄로 접어도 마찬가지였다 — 세로로 읽는 글자 한
        덩이가 가로로 늘어선 숫자 옆에 서 있으니 결이 맞을 수가 없다.

        위에 한 줄로 빼면 이름은 제 자리를 갖고, 값 여섯은 판 폭을 통째로 나눠 쓴다.
      */}
      <p className={styles.board__name}>
        충남 전체
        <span>관내 합계</span>
      </p>

      <div className={styles.board__cells}>
        {cells.map((cell) => (
          <div key={cell.key} className={styles.cell} data-tone={cell.tone}>
            <p className={styles.cell__label}>{cell.label}</p>
            <p className={styles.cell__value}>
              {cell.value}
              {cell.unit ? <span className={styles.cell__unit}>{cell.unit}</span> : null}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
