import { RankList } from './components/RankList';
import { SummaryStrip } from './components/SummaryStrip';
import { TargetDetail } from './components/TargetDetail';
import { useTickerBoard } from './useTickerBoard';
import styles from './Ticker.module.scss';
import type { ControlRoomData } from '../../useControlRoomData';

/**
 * 시안 C — 시세판.
 *
 * 학교별·기관별·지역별 가운데 하나를 고르고, 목록에서 대상 하나를 고르면 그 대상의 발전량과
 * 발전시간이 차트로 펼쳐진다. 시안 A 의 판 일곱(AI 진단·시·군 지도·장애 현황 등)을 가져오지
 * 않고, **목록 + 고른 하나의 차트와 값**으로 끝낸다 — 덜 담는 대신 글자를 키워 한눈에 든다.
 *
 * 이 파일은 배치만 조합한다. 목록과 상세가 **같은 축·같은 선택**을 봐야 하므로, 공용 훅
 * 하나(`useTickerBoard`)를 여기서 부르고 두 판에 통째로 내린다 — 판마다 따로 집계하면 왼쪽에서
 * 고른 대상과 오른쪽이 그린 대상이 어긋난다.
 *
 * 맨 위 요약 띠(`SummaryStrip`)는 「도 전체는 지금 어떤가」 를 말하는 자리라 고른 대상과 무관하다.
 * 그래서 공용 훅에 얽매지 않고 `data` 하나만 받아 스스로 셈하고 스스로 넘긴다.
 */
export function Ticker({ data }: { data: ControlRoomData }) {
  const board = useTickerBoard(data);

  return (
    <div className={styles.board}>
      <div className={styles.cell} style={{ gridArea: 'strip' }}>
        <SummaryStrip data={data} />
      </div>
      <div className={styles.cell} style={{ gridArea: 'list' }}>
        <RankList board={board} />
      </div>
      <div className={styles.cell} style={{ gridArea: 'detail' }}>
        <TargetDetail board={board} />
      </div>
    </div>
  );
}

export default Ticker;
