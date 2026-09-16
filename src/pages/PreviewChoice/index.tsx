import { Link } from 'react-router-dom';
import { EDU_LEVEL_LABEL, EDU_LEVELS } from '@/mocks/eduContent';
import { Logo } from '@/components/layout/Logo';
import { PATH } from '@/routes/routes';
import type { EduLevel } from '@/interface/edu';
import styles from './PreviewChoice.module.scss';

/**
 * 시연에서 열 수 있는 화면 (2026-09-16 지시).
 *
 * 줄 하나가 갈래 하나다. 갈래 안에서 시안을 고르는 일은 **한 줄 안에서** 끝난다 —
 * 카드를 갈래마다 여러 장 늘어놓았더니 통합관제 카드와 교육용 카드가 같은 크기로 섞여,
 * 무엇이 갈래이고 무엇이 그 안의 시안인지 한 번 더 세어야 했다.
 *
 * 교육용은 눈높이마다 줄을 따로 준다. 같은 시안이라도 초·중·고가 서로 다른 화면을 그리므로
 * (`EDU_CELLS` 가 눈높이×시안 아홉 칸을 저마다 다른 컴포넌트로 잇는다), A·B·C 석 줄로는
 * 아홉 화면 가운데 어디로 가는지 고를 수 없다.
 *
 * 설명을 적지 않는다. 이 화면이 하는 일은 「어디로 갈지 고르는 것」 하나뿐이고, 시연을 여는
 * 사람은 이미 무엇이 무엇인지 알고 온다. 설명을 달면 고르는 자리가 그만큼 뒤로 밀린다.
 */

/** 교육용 시안 주소. 눈높이는 쿼리로 얹는다 — `resolveEduLevel` 이 이 값을 먼저 본다 */
const EDU_VARIANTS = [
  { label: 'A', to: PATH.SOLAR_EDU_A },
  { label: 'B', to: PATH.SOLAR_EDU_B },
  { label: 'C', to: PATH.SOLAR_EDU_C },
];

const eduLinks = (level: EduLevel) => EDU_VARIANTS.map(({ label, to }) => ({
  label,
  to: `${to}?level=${level}`,
}));

const GROUPS = [
  {
    kind: '통합관제',
    links: [
      { label: 'A', to: PATH.CONTROL },
      { label: 'B', to: PATH.CONTROL_B },
      { label: 'C', to: PATH.CONTROL_C },
    ],
  },
  ...EDU_LEVELS.map((level) => ({
    kind: `교육용 · ${EDU_LEVEL_LABEL[level]}`,
    links: eduLinks(level),
  })),
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
