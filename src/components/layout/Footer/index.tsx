import { Logo } from '@/components/layout/Logo';
import styles from './Footer.module.scss';

const RELATED_SITES = [
  { label: '충청남도교육청', href: 'https://www.cne.go.kr' },
  { label: '한국에너지공단', href: 'https://www.energy.or.kr' },
  { label: '신·재생에너지센터', href: 'https://www.knrec.or.kr' },
];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footer__inner}>
        <div className={styles.footer__brand}>
          <Logo />
          <address className={styles.footer__address}>
            충청남도 홍성군 홍북읍 선화로 22 충청남도교육청
            <br />
            대표전화 041-640-0114 · 시설과 041-640-0000
          </address>
        </div>

        {/*
          메뉴는 되풀이하지 않는다 — 머리띠가 어느 화면에서나 같은 길을 이미 열어 두고 있어,
          발치에 한 벌 더 두면 같은 이름이 두 번 읽힐 뿐이다. 바깥으로 나가는 길만 남긴다.
        */}
        <nav className={styles.footer__nav} aria-label="관련 기관">
          <div className={styles.footer__group}>
            <p className={styles.footer__groupTitle}>관련 기관</p>
            <ul className={styles.footer__links}>
              {RELATED_SITES.map((site) => (
                <li key={site.href}>
                  <a href={site.href} className={styles.footer__link} target="_blank" rel="noreferrer">
                    {site.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      <div className={styles.footer__bottom}>
        <div className={styles.footer__bottomInner}>
          <p className={styles.footer__copyright}>© 2026 Chungcheongnam-do Office of Education. All rights reserved.</p>
          <p className={styles.footer__note}>본 시스템의 발전량은 15분 주기로 수집되며, 정산 기준 값과 다를 수 있습니다.</p>
        </div>
      </div>
    </footer>
  );
}
