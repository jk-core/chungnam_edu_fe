import { AggregationCard, AiPanel, YieldPanel } from '../components/panels';
import { MapBoard } from './MapBoard';
import styles from './Versions.module.scss';
import type { ControlRoomData } from '../useControlRoomData';

/**
 * 「한눈에 보는」 상황판 시안 (`/control/v1` ~ `/control/v3`).
 *
 * 셋 모두 관내 발전소 현황을 왼쪽 단에 세운다. 그 판 안에 시·군 도형 · 시·군 상세 칸 · 충남 전체
 * 박스가 함께 들어 있어, 「어느 시·군이」 와 「도 전체로는」 이 한 판에서 끝난다. 오른쪽 단에
 * 무엇을 세우는지가 시안을 가른다.
 *
 * 짜면서 잰 것을 적어 둔다 — 같은 자리를 다시 파지 않으려는 기록이다.
 *
 * **자라는 판은 둘뿐이다.** 지도(도형이 칸을 채운다)와 AI 진단(판 안 지역 지도가 남는 높이를
 * 받는다). 집계표는 여섯 줄 430px, 실적 표는 네 줄 353px 로 못 박혀 있어 자리를 줘도 그만큼 빈다.
 * 그래서 오른쪽 단은 **끝을 자라는 판으로 맺거나**, 실적 표를 늘려 칸을 채우게 한다.
 *
 * **충남 전체 박스는 판 폭을 탄다.** 여섯 값을 한 줄로 세우려면 칸마다 250px 는 있어야 하고,
 * 그보다 좁으면 「경고 5 · 주의 9 · 미수신 35」 같은 보조 줄이 말줄임으로 잘린다. 판 안에서는
 * 두 줄 · 세 칸으로 접어 잘리지 않게 한다.
 *
 * **지도와 집계표는 위아래로 못 쌓는다.** 지도 판이 제 키를 갖추려면 620px 이 넘고 집계표가
 * 430px 이라 화면(949px)을 넘긴다. 세 시안 모두 이 둘이 좌우로 서는 까닭이다.
 */

interface LayoutProps {
  data: ControlRoomData;
}

/** 세로로 쌓는 단 하나. `grow` 를 받은 판이 남는 높이를 가져간다. */
function Rail({ children }: { children: React.ReactNode }) {
  return <div className={styles.rail}>{children}</div>;
}

/**
 * v1 · 지표 전면 — 쌓인 숫자가 먼저.
 *
 * 오른쪽 단에 누적 실적과 시·군 집계표를 함께 세우는 유일한 시안이다. 위는 「오늘·이달·올해·누적」
 * 으로 시간을 따라 쌓인 양이고, 아래는 같은 오늘을 시·군으로 갈라 세운 순위다 — 세로축이 시간과
 * 지역으로 갈린다.
 *
 * 실적 표가 단에 남는 높이를 받아 네 줄을 고르게 편다. 집계표는 여섯 줄로 못 박혀 줄지도 늘지도
 * 못하므로, 남는 몫은 늘어날 수 있는 실적 표 쪽으로 보낸다.
 */
export function KpiStage({ data }: LayoutProps) {
  return (
    <div className={`${styles.stage} ${styles.kpiStage}`}>
      <MapBoard
        plants={data.rows}
        totals={data.totals}
        abnormalCount={data.abnormalCount}
        collection={data.collection.byId}
        alerts={data.openAlerts}
      />

      <Rail>
        <YieldPanel plants={data.rows} totals={data.totals} grow />
        <AggregationCard plants={data.rows} />
      </Rail>
    </div>
  );
}

/**
 * v2 · 지도 전면 — 어디가 어떤가가 먼저.
 *
 * 지도 판에 가장 넓은 폭을 준다. 도형이 커지는 만큼 시·군 이름과 개소가 멀리서도 읽힌다.
 *
 * 오른쪽은 집계표가 위, AI 진단이 아래다. 지도가 면으로 말한 것을 집계표가 같은 차례로 줄 세워
 * 다시 말하고, 그 아래 진단이 지금 비치고 있는 시·군을 글로 풀어 준다 — 세 판이 같은 곳을 함께
 * 가리킨다. 진단이 단의 남는 높이를 받으므로 아래에 빈 자리가 남지 않는다.
 */
export function MapStage({ data }: LayoutProps) {
  return (
    <div className={`${styles.stage} ${styles.mapStage}`}>
      <MapBoard
        plants={data.rows}
        totals={data.totals}
        abnormalCount={data.abnormalCount}
        collection={data.collection.byId}
        alerts={data.openAlerts}
      />

      <Rail>
        <AggregationCard plants={data.rows} />
        <AiPanel plants={data.rows} grow />
      </Rail>
    </div>
  );
}

/**
 * v3 · 진단 전면 — 무엇을 살펴야 하나가 먼저.
 *
 * 오른쪽 위를 AI 진단이 크게 쓴다. 지역을 한 곳씩 돌며 규모·출력·실적·상태를 글로 풀고, 판 안의
 * 지역 지도가 남는 높이를 받는다. 왼쪽 지도와 같은 시·군을 같은 시각에 비추므로 두 판이 한 곳을
 * 함께 가리킨다.
 *
 * 아래는 누적 실적이다. 진단이 「지금 이 지역이 어떤가」 를 말하면 그 아래에서 「도 전체로 여태
 * 얼마나 쌓였나」 가 받는다.
 */
export function DiagnosisStage({ data }: LayoutProps) {
  return (
    <div className={`${styles.stage} ${styles.diagnosisStage}`}>
      <MapBoard
        plants={data.rows}
        totals={data.totals}
        abnormalCount={data.abnormalCount}
        collection={data.collection.byId}
        alerts={data.openAlerts}
      />

      <Rail>
        <AiPanel plants={data.rows} grow />
        <YieldPanel plants={data.rows} totals={data.totals} />
      </Rail>
    </div>
  );
}
