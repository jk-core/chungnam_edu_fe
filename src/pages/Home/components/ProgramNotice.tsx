import { InfoIcon } from '@/components/common/Icon';
import styles from './ProgramNotice.module.scss';

/**
 * 이 시스템이 무엇으로 지어졌는지 (홈 최상단).
 *
 * 들어오자마자 보이는 자리에 사업 근거를 한 줄 둔다. 공공 시스템은 "누가 왜 만들었는가" 가
 * 화면 어딘가에 반드시 있어야 하는데, 푸터까지 내려가야 나오면 사실상 없는 것과 같다.
 *
 * 닫을 수 있게 두지 않는다. 한 줄이라 자리를 거의 먹지 않고, 닫아 둔 사람에게는 영영 보이지
 * 않는 안내가 되기 때문이다.
 */
export function ProgramNotice() {
  return (
    <aside className={styles.notice} aria-label="사업 안내">
      <div className={styles.notice__inner}>
        <InfoIcon className={styles.notice__icon} width={16} height={16} />
        <p className={styles.notice__text}>
          <strong className={styles.notice__title}>공공시설 태양광 보급사업</strong>
          충청남도교육청이 산업통상자원부·한국에너지공단의 신·재생에너지 보급지원사업으로 관내 학교에 설치한
          태양광 설비를 통합 관리합니다.
        </p>
      </div>
    </aside>
  );
}
