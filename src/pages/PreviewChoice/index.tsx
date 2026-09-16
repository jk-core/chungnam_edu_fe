import { Link } from 'react-router-dom';
import { Logo } from '@/components/layout/Logo';
import { PATH } from '@/routes/routes';
import styles from './PreviewChoice.module.scss';

/**
 * 시연에서 열 수 있는 화면.
 *
 * 통합관제 둘(최종안과 견줌용 시안 하나), 교육용 대시보드 시안 셋, 관리자 콘솔 하나다.
 *
 * 시안 설명은 **표출 방식**만 적는다. 시안 이름(「세 개의 질문」·「데이터 콘솔」 따위)과 화면
 * 구성은 눈높이마다 달라, 그중 하나를 여기 적으면 다른 두 눈높이에서는 틀린 말이 된다.
 * 세 눈높이를 관통하는 것은 「한 번에 한 주제인가, 한 화면에 전부인가, 카드로 나누는가」 뿐이다.
 */
const CHOICES = [
  {
    to: PATH.CONTROL,
    kind: '통합관제',
    name: '상황판',
    body: '관내 발전 현황과 AI 진단, 장애 발생 현황을 한 화면에 표출합니다.',
  },
  {
    to: PATH.CONTROL_B,
    kind: '통합관제',
    name: '시안 b',
    body: '판을 덜어 내고 남은 판을 키워 멀리서도 읽히게 한 견줌용 시안입니다.',
  },
  {
    to: PATH.SOLAR_EDU_A,
    kind: '교육용 대시보드',
    name: '시안 a',
    body: '한 번에 한 주제만 표출하고 일정 시간마다 자동 전환합니다.',
  },
  {
    to: PATH.SOLAR_EDU_B,
    kind: '교육용 대시보드',
    name: '시안 b',
    body: '전체 지표를 한 화면에 배치해 전환 없이 표출합니다.',
  },
  {
    to: PATH.SOLAR_EDU_C,
    kind: '교육용 대시보드',
    name: '시안 c',
    body: '항목을 카드 단위로 나누어 표출합니다.',
  },
  {
    to: PATH.ADMIN_PLANTS,
    kind: '관리자 콘솔',
    name: '발전소 관리',
    body: '발전소·설비 대장과 현장보고서, 계정·연계 설정을 관리합니다.',
  },
];

/**
 * 시연용 화면 고르개 (2026-09-09 지시 · 2026-09-16 플래그로 전환).
 *
 * `VITE_ONLY_PREVIEW` 가 켜져 있을 때만 서는 화면이다. 막아 둔 주소로 들어오면 모두 이리로
 * 모이므로, 시연 중에 주소를 잘못 짚어도 빈 화면이나 로그인 화면을 만나지 않는다.
 *
 * 한때는 브랜치를 따로 파서 라우트를 통째로 갈아 끼웠다. 그러면 시연 뒤에 그 브랜치를 어떻게
 * 되돌릴지가 남고, 본 가지에서 고친 것을 시연 가지로 다시 옮겨야 한다. 플래그 하나로 갈라
 * 두면 같은 코드가 두 모습으로 서므로 그 일이 없다.
 */
export default function PreviewChoicePage() {
  return (
    <main className={styles.choice}>
      <header className={styles.choice__head}>
        <Logo size="lg" />
        <p className={styles.choice__note}>시연에서 볼 화면을 고르세요</p>
      </header>

      <ul className={styles.list}>
        {CHOICES.map((choice) => (
          <li key={choice.to}>
            <Link className={styles.card} to={choice.to}>
              <span className={styles.card__kind}>{choice.kind}</span>
              <span className={styles.card__name}>{choice.name}</span>
              <span className={styles.card__body}>{choice.body}</span>
              <span className={styles.card__go} aria-hidden="true">열기 →</span>
            </Link>
          </li>
        ))}
      </ul>

      <p className={styles.choice__foot}>
        교육용 대시보드는 조회 대상의 학교급에 따라 초·중·고 눈높이로 구성이 달라집니다.
        <br />
        시연용 화면이므로 위 화면 외의 주소로 접속하면 이 화면으로 이동합니다.
      </p>
    </main>
  );
}
