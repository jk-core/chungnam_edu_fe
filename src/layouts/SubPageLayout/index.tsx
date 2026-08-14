import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import { Breadcrumb } from '@/components/layout/Breadcrumb';
import { Lnb } from '@/components/layout/Lnb';
import { PATH } from '@/routes/routes';
import { PageSkeleton } from '@/components/common/Skeleton';
import { PlantScopePanel } from '@/components/plant/PlantScopePanel';
import { findChild, findSection } from '@/configs/navigation';
import styles from './SubPageLayout.module.scss';

/**
 * 홈이 아닌 모든 페이지의 골격.
 * KRDS 를 따라 브레드크럼 → 페이지 제목 → (좌측 컬럼 + 본문) 순으로 배치한다.
 * 좌측 컬럼에는 하위 메뉴가 들어가고, 설비를 조회하는 화면에만 조회 대상 패널이 함께 붙는다.
 */
export default function SubPageLayout() {
  const { pathname } = useLocation();
  const section = findSection(pathname);
  const child = findChild(section, pathname);

  if (!section || section.children.length === 0) return <Navigate to={PATH.HOME} replace />;

  // 게시판·보고서·마이페이지처럼 설비를 고를 일이 없는 화면에는 패널을 두지 않는다.
  const needsScope = child?.needsScope ?? false;
  // 목록 아래 상세 화면이면 목록을 한 단 더 얹어 3단으로 만든다.
  const isDetail = Boolean(child && pathname !== child.path);

  return (
    <div className={styles.sub}>
      <div className={styles.sub__head}>
        <div className={styles.sub__headInner}>
          <Breadcrumb
            items={[
              { label: section.label, path: section.children[0].path },
              ...(isDetail && child
                ? [{ label: child.label, path: child.path }, { label: '상세' }]
                : [{ label: child?.label ?? section.label }]),
            ]}
          />
          <h1 className={styles.sub__title}>{child?.label ?? section.label}</h1>
          {child ? <p className={styles.sub__description}>{child.description}</p> : null}
        </div>
      </div>

      <div className={styles.sub__body}>
        {/* 조회 대상이 위, 하위 메뉴가 아래. 가로 탭으로 바뀌는 구간에서는 메뉴를 먼저 둔다. */}
        <aside className={styles.sub__side}>
          {needsScope ? <PlantScopePanel /> : null}
          <Lnb section={section} />
        </aside>

        <div className={styles.sub__content}>
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
