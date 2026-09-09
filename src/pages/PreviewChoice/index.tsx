import { Link } from 'react-router-dom';
import { Logo } from '@/components/layout/Logo';
import { PATH } from '@/routes/routes';
import styles from './PreviewChoice.module.scss';

/**
 * 시연에서 열 수 있는 화면.
 *
 * 통합관제 하나와 교육용 대시보드 시안 셋이다.
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
];

/**
 * 시연용 화면 고르개 (2026-09-09 지시).
 *
 * 이 브랜치는 시연을 위해 통합관제와 교육용 대시보드만 열어 두었다. 막아 둔 주소로 들어오면
 * 모두 이 화면으로 모이므로, 시연 중에 주소를 잘못 짚어도 빈 화면이나 로그인 화면을 만나지 않는다.
 *
 * 시연이 끝나면 이 화면과 `routesList` 의 시연용 목록을 함께 걷는다.
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
        시연용 화면이므로 위 네 화면 외의 주소로 접속하면 이 화면으로 이동합니다.
      </p>
    </main>
  );
}
