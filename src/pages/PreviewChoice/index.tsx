import { Link } from 'react-router-dom';
import { EDU_LEVEL_LABEL, EDU_LEVELS } from '@/mocks/eduContent';
import { EDU_CELLS, EDU_VARIANTS as EDU_KEYS } from '@/components/solar-edu/variants/EduBoard';
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
 * 글자 이름 아래에 컨셉을 한마디로 붙인다. 「A·B·C」 만으로는 시연을 여는 사람도 어느 것이
 * 어느 화면인지 눌러 봐야 알고, 같은 글자가 줄마다 다른 화면을 가리키므로 더 그렇다 — 교육용
 * A 는 초등에서는 「걸음마다 한 장」 이고 고등에서는 「세 개의 질문」 이다.
 *
 * 컨셉 이름은 **시안이 스스로 달고 있는 이름을 끌어다 쓴다**(`EDU_CELLS`). 여기서 따로 지으면
 * 시안 이름을 고쳤을 때 이 화면만 옛말로 남는다. 「시안 a · 」 같은 앞머리는 떼고 뒤만 쓴다 —
 * 어느 시안인지는 옆의 큰 글자가 이미 말한다.
 */

/** 「시안 a · 세 개의 질문」 에서 뒤쪽 한마디만 — 앞머리는 옆 글자와 겹친다 */
function conceptOf(label: string): string {
  const [, concept] = label.split('·');

  return (concept ?? label).trim();
}

const CONTROL_LINKS = [
  { label: 'A', concept: '모든 정보 한번에', to: PATH.CONTROL },
  { label: 'B', concept: '정보 줄이고 크게', to: PATH.CONTROL_B },
  { label: 'C', concept: '카카오맵 기반', to: PATH.CONTROL_C },
];

/** 교육용 시안 주소. 눈높이는 쿼리로 얹는다 — `resolveEduLevel` 이 이 값을 먼저 본다 */
const EDU_PATH: Record<string, string> = {
  a: PATH.SOLAR_EDU_A,
  b: PATH.SOLAR_EDU_B,
  c: PATH.SOLAR_EDU_C,
};

const eduLinks = (level: EduLevel) => EDU_KEYS.map((key) => ({
  label: key.toUpperCase(),
  concept: conceptOf(EDU_CELLS[level][key].label),
  to: `${EDU_PATH[key]}?level=${level}`,
}));

const GROUPS = [
  { kind: '통합관제', links: CONTROL_LINKS },
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
                  <b>{link.label}</b>
                  <span>{link.concept}</span>
                </Link>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
