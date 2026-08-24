import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from '@/components/common/Icon';
import { Reveal } from '@/components/common/Reveal';
import styles from '@/pages/Admin/Admin.module.scss';
import type { ReactNode } from 'react';

interface FormPageProps {
  title: string;
  description?: string;
  /** 돌아갈 목록 주소 */
  backTo: string;
  /** 저장·취소 버튼 자리 */
  footer: ReactNode;
  /**
   * 삭제처럼 되돌릴 수 없는 것. 저장 줄 왼쪽 끝에 따로 세운다 —
   * 목록에서 잘못 눌러 지우는 일이 없게, 그 대상을 열어 놓고서만 지운다.
   */
  danger?: ReactNode;
  children: ReactNode;
}

/**
 * 등록·수정 폼 한 장.
 *
 * 예전에는 모달로 띄웠는데, 설비처럼 칸이 스무 개 넘는 폼은 창 안에서 다시 스크롤하게 되어
 * 어디까지 적었는지 잃기 쉬웠다. 이제 폼마다 주소를 갖는 페이지라 새로고침·뒤로가기가 살고,
 * 그 위에 뜨는 것은 검색기와 확인 대화상자 한 겹뿐이다.
 */
export function FormPage({ title, description, backTo, footer, danger, children }: FormPageProps) {
  return (
    <Reveal>
      <div className={styles.formPage}>
        <header className={styles.formPage__head}>
          <Link to={backTo} className={styles.formPage__back}>
            <ChevronLeftIcon width={16} height={16} />
            목록으로
          </Link>
          <h2 className={styles.formPage__title}>{title}</h2>
          {description ? <p className={styles.formPage__description}>{description}</p> : null}
        </header>

        <div className={styles.formPage__body}>
          <div className={styles.form}>{children}</div>
        </div>

        <footer className={styles.formPage__foot}>
          <div className={styles.formPage__danger}>{danger}</div>
          <div className={styles.formPage__actions}>{footer}</div>
        </footer>
      </div>
    </Reveal>
  );
}
