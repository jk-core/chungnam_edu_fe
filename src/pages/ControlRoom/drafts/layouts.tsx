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
 * 시안 다섯의 배치.
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
 * 시안 1 — 좌우 뒤집기.
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
 * 시안 2 — 지도 선두.
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
 * 시안 3 — AI 가운데.
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

/**
 * 시안 4 — 네 단.
 *
 * 장애 현황을 제 열로 떼어 내 위 판에 밀리지 않게 한다. 남색 자리에 금색을 앉혀
 * 발전 화면다운 결을 준다 — 지도만 제 색을 지켜 대비가 생긴다.
 */
export function Quad({ data }: LayoutProps) {
  return (
    <div className={`${styles.board} ${styles.quad} ${styles.sunlit}`}>
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
      </Col>

      <Col>
        <FaultPanel plants={data.rows} abnormalCount={data.abnormalCount} collection={data.collection.byId} grow />
      </Col>
    </div>
  );
}

/**
 * 시안 5 — 격자 정렬.
 *
 * 넓은 판 넷의 아랫선·윗선을 맞춰 두 줄로 세운다. 위는 지금 벌어지는 일(지도·AI 진단),
 * 아래는 세어 놓은 것(집계·장애)이다. 어두운 결로 두어 관제실 조명에서 어떻게 읽히는지 본다.
 */
export function Matrix({ data }: LayoutProps) {
  return (
    <div className={`${styles.board} ${styles.matrix}`}>
      <div className={`${base.col} ${styles.tall}`}>
        <OutputPanel totals={data.totals} />
        <YieldPanel plants={data.rows} totals={data.totals} />
        <RegionPanel grow />
      </div>

      <MapPanel plants={data.rows} abnormalCount={data.abnormalCount} />
      <AiPanel plants={data.rows} />

      <AggregationCard plants={data.rows} />
      <FaultPanel plants={data.rows} abnormalCount={data.abnormalCount} collection={data.collection.byId} />
    </div>
  );
}
