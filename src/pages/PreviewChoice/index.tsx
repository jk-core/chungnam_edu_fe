import { Link } from 'react-router-dom';
import { Logo } from '@/components/layout/Logo';
import { PATH } from '@/routes/routes';
import styles from './PreviewChoice.module.scss';

/**
 * 시연에서 열 수 있는 화면 (2026-09-16 지시).
 *
 * 줄 하나가 화면 갈래 하나다. 갈래 안에서 시안을 고르는 일은 **한 줄 안에서** 끝난다 —
 * 카드를 갈래마다 여러 장 늘어놓았더니 통합관제 카드와 교육용 카드가 같은 크기로 섞여,
 * 무엇이 갈래이고 무엇이 그 안의 시안인지 한 번 더 세어야 했다.
 *
 * 설명을 적지 않는다. 이 화면이 하는 일은 「어디로 갈지 고르는 것」 하나뿐이고, 시연을 여는
 * 사람은 이미 무엇이 무엇인지 알고 온다. 설명을 달면 고르는 자리가 그만큼 뒤로 밀린다.
 */
const GROUPS = [
  {
    kind: '통합관제',
    links: [
      { label: 'A', to: PATH.CONTROL },
      { label: 'B', to: PATH.CONTROL_B },
      { label: 'C', to: PATH.CONTROL_C },
    ],
  },
  {
    kind: '교육용 대시보드',
    links: [
      { label: 'A', to: PATH.SOLAR_EDU_A },
      { label: 'B', to: PATH.SOLAR_EDU_B },
      { label: 'C', to: PATH.SOLAR_EDU_C },
    ],
  },
  {
    kind: '관리자 콘솔',
    links: [{ label: '열기', to: PATH.ADMIN_PLANTS }],
  },
];

export default function PreviewChoicePage() {
  return (
    <main className={styles.choice}>
      <header className={styles.choice__head}>
        <Logo size="lg" />
      </header>

      <ul className={styles.list}>
        {GROUPS.map((group) => (
          <li key={group.kind} className={styles.row}>
            <span className={styles.row__kind}>{group.kind}</span>

            <span className={styles.row__links}>
              {group.links.map((link) => (
                <Link key={link.to} className={styles.go} to={link.to}>
                  {link.label}
                </Link>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
