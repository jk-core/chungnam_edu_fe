import {
  AggregationCard,
  AiPanel,
  FaultPanel,
  MapPanel,
  OutputPanel,
  RegionPanel,
  YieldPanel,
} from '../components/panels';
import base from '../ControlRoom.module.scss';
import styles from './Drafts.module.scss';
import type { ControlRoomData } from '../useControlRoomData';

/**
 * 시안 넷(B~E)의 배치.
 *
 * 판 일곱은 `/control` 이 세우는 것을 그대로 받아 쓴다 — 이 파일이 정하는 것은 어느 판이
 * 어느 열에, 어떤 차례로 서는가 하나뿐이다. 그래야 나란히 놓고 볼 때 배치만 눈에 걸린다.
 */

interface LayoutProps {
  data: ControlRoomData;
}

/** 열 하나. 세로 배분은 `/control` 의 규칙을 그대로 물려받는다. */
function Col({ children }: { children: React.ReactNode }) {
  return <div className={base.col}>{children}</div>;
}

/**
 * 시안 B — 좌우 뒤집기.
 *
 * 판은 `/control` 과 같은 짝으로 묶여 있고 열의 차례만 뒤집었다. 눈이 처음 닿는 왼쪽에
 * 「먼저 봐야 할 것」 을 두면 어떻게 읽히는지를 본다.
 */
export function Mirror({ data }: LayoutProps) {
  return (
    <div className={`${styles.board} ${styles.mirror}`}>
      <Col>
        <AiPanel plants={data.rows} grow />
        <FaultPanel plants={data.rows} abnormalCount={data.abnormalCount} collection={data.collection.byId} />
      </Col>

      <Col>
        <MapPanel plants={data.rows} abnormalCount={data.abnormalCount} grow />
        <AggregationCard plants={data.rows} />
      </Col>

      <Col>
        <OutputPanel totals={data.totals} />
        <YieldPanel plants={data.rows} totals={data.totals} />
        <RegionPanel grow />
      </Col>
    </div>
  );
}

/**
 * 시안 C — 지도 선두.
 *
 * 「어디가」 를 왼쪽 끝에서 답하고 오른쪽으로 갈수록 좁혀 읽는다. 판 머리를 색 띠로 채워
 * 판의 경계가 멀리서도 세어진다.
 */
export function MapFirst({ data }: LayoutProps) {
  return (
    <div className={`${styles.board} ${styles.mapFirst} ${styles.headband}`}>
      <Col>
        <MapPanel plants={data.rows} abnormalCount={data.abnormalCount} grow />
        <AggregationCard plants={data.rows} />
      </Col>

      <Col>
        <OutputPanel totals={data.totals} />
        <YieldPanel plants={data.rows} totals={data.totals} />
        <RegionPanel grow />
      </Col>

      <Col>
        <AiPanel plants={data.rows} grow />
        <FaultPanel plants={data.rows} abnormalCount={data.abnormalCount} collection={data.collection.byId} />
      </Col>
    </div>
  );
}

/**
 * 시안 E — 사이버네틱.
 *
 * 배치는 `/control` 과 똑같이 둔다 — 이 시안이 묻는 것은 **어디에 서는가** 가 아니라
 * **무슨 결로 보이는가** 하나뿐이라, 자리가 함께 달라지면 무엇 때문에 다르게 읽히는지 갈린다.
 * 색·글꼴·판의 질감만 갈아 끼우고 나머지는 손대지 않는다.
 */
export function Cyber({ data }: LayoutProps) {
  return (
    <div className={`${styles.board} ${styles.stack}`}>
      <Col>
        <OutputPanel totals={data.totals} />
        <YieldPanel plants={data.rows} totals={data.totals} />
        <RegionPanel grow />
      </Col>

      <Col>
        <MapPanel plants={data.rows} abnormalCount={data.abnormalCount} grow />
        <AggregationCard plants={data.rows} />
      </Col>

      <Col>
        <AiPanel plants={data.rows} grow />
        <FaultPanel plants={data.rows} abnormalCount={data.abnormalCount} collection={data.collection.byId} />
      </Col>
    </div>
  );
}

/**
 * 시안 D — AI 가운데.
 *
 * 「먼저 봐야 할 것」 을 화면 한가운데 세운다. 지도는 오른쪽으로 물러나 여전히 제일 넓은 자리를
 * 쓰고, 눈은 가운데에서 시작해 좌우로 갈라진다. 광과 그림자를 걷어 도면에 가까운 결로 둔다.
 */
export function Split({ data }: LayoutProps) {
  return (
    <div className={`${styles.board} ${styles.split} ${styles.blueprint}`}>
      <Col>
        <OutputPanel totals={data.totals} />
        <YieldPanel plants={data.rows} totals={data.totals} />
        <RegionPanel grow />
      </Col>

      <Col>
        <AiPanel plants={data.rows} grow />
        <FaultPanel plants={data.rows} abnormalCount={data.abnormalCount} collection={data.collection.byId} />
      </Col>

      <Col>
        <MapPanel plants={data.rows} abnormalCount={data.abnormalCount} grow />
        <AggregationCard plants={data.rows} />
      </Col>
    </div>
  );
}
