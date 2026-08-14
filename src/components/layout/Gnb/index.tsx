import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { findSection } from '@/configs/navigation';
import { cn } from '@/utils/cn';
import { useVisibleNavigation } from '@/hooks/useVisibleNavigation';
import styles from './Gnb.module.scss';

/**
 * 주 메뉴 띠 (KRDS 헤더).
 *
 * KRDS 는 브랜드 줄과 주메뉴 줄을 위아래로 가른다. 한 줄에 로고·메뉴·유틸을 모두 넣으면 메뉴가
 * 가운데 끼어 눌리는데, 줄을 나누면 주메뉴가 제 폭을 다 쓰고 1뎁스가 나란히 선다.
 *
 * 펼침도 KRDS 방식이다 — 항목 하나에만 딸린 작은 드롭다운이 아니라, **모든 주메뉴와 그 하위가
 * 한 판에 함께** 내려온다. 지금 가리킨 곳만 도드라지되 나머지도 보이므로, 원하는 곳이 여기가
 * 아니었다는 걸 알아차린 사람이 판을 닫고 다시 짚을 필요가 없다.
 *
 * 띠 전체가 이 부품이다 — 펼침 판이 화면 폭을 다 써야 해서 안쪽 컨테이너 바깥에 놓여야 하고,
 * 그러려면 띠와 판이 한 부모 아래 있어야 한다.
 */
export function Gnb() {
  const { pathname } = useLocation();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const activeSection = findSection(pathname);
  const navigation = useVisibleNavigation();
  // 하위가 없는 곳(홈)에 머무는 동안에는 펼칠 것이 없다.
  const isOpen = navigation.some((section) => section.path === openPath && section.children.length > 0);

  /*
    쪽을 고르고 나면 판을 접는다.

    판은 마우스가 띠 밖으로 나갈 때 닫히는데, 누른 자리가 곧 판 안이라 마우스는 그대로 머문다.
    그러면 원하는 곳으로 옮겨 갔는데도 판이 본문을 덮은 채 남아, 손을 한 번 더 휘저어야 한다.
  */
  const close = () => setOpenPath(null);

  return (
    <nav
      className={styles.navbar}
      aria-label="주 메뉴"
      onMouseLeave={() => setOpenPath(null)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpenPath(null);
      }}
    >
      <div className={styles.navbar__inner}>
        <ul className={styles.list}>
          {navigation.map((section) => {
            const isActive = activeSection?.path === section.path;

            return (
              <li key={section.path} className={styles.item}>
                <NavLink
                  to={section.children[0]?.path ?? section.path}
                  className={cn(styles.link, { [styles['link--active']]: isActive })}
                  aria-current={isActive ? 'page' : undefined}
                  aria-expanded={section.children.length > 0 ? openPath === section.path : undefined}
                  onMouseEnter={() => setOpenPath(section.path)}
                  onFocus={() => setOpenPath(section.path)}
                  onClick={close}
                >
                  {section.label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>

      {/*
        전체 펼침 판.
        띠 아래 화면 폭을 다 쓰고 내려온다 — 안쪽 글은 본문과 같은 컨테이너에 맞춰,
        메뉴 이름이 위 1뎁스와 세로로 어긋나지 않게 한다.
      */}
      {isOpen ? (
        <div className={styles.mega}>
          <div className={styles.mega__inner}>
            {navigation
              .filter((section) => section.children.length > 0)
              .map((section) => (
                <section
                  key={section.path}
                  className={styles.group}
                  data-on={section.path === openPath ? '' : undefined}
                >
                  <h2 className={styles.group__title}>{section.label}</h2>

                  <ul className={styles.group__list}>
                    {section.children.map((child) => (
                      <li key={child.path}>
                        {/*
                          지금 보고 있는 쪽. 함수형 className 을 써야 라우터가 켜짐을 알려 준다 —
                          문자열로 주면 활성 표시가 붙지 않는다. `aria-current` 는 라우터가 알아서 단다.
                        */}
                        <NavLink
                          to={child.path}
                          className={({ isActive }) => cn(styles.group__link, {
                            [styles['group__link--on']]: isActive,
                          })}
                          onClick={close}
                        >
                          <span className={styles.group__label}>{child.label}</span>
                          <span className={styles.group__description}>{child.description}</span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
