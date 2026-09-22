import { Component } from 'react';
import styles from './ErrorBoundary.module.scss';
import type { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  /** 어느 자리가 죽었는지 — 화면과 콘솔에 함께 적는다 */
  label?: string;
  /** 대신 세울 것. 비우면 아래 기본 문구가 선다 */
  fallback?: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * 한 자리가 죽어도 나머지가 살아 있게 한다.
 *
 * 이것이 없는 동안에는 판 하나의 한 줄이 잘못되면 화면 **전체**가 라우터의
 * 「Unexpected Application Error!」 로 날아갔다. 벽에 걸어 두는 상황판에서는 그 사이 아무도
 * 아무 값도 못 본다 — 여섯 판이 멀쩡한데 한 판 때문에 일곱을 잃는다.
 *
 * 목업으로 짓던 화면에 API 가 붙으면서 빈 배열·`null`·누락이 들어오기 시작했고, 그 값이
 * 열 단계를 흘러가 엉뚱한 자리에서 터진다. 원인을 하나씩 잡는 것과 별개로, **터져도 그 자리만
 * 잃는** 장치가 먼저 있어야 한다.
 *
 * 클래스로 두는 까닭은 React 가 렌더 중 오류를 함수 컴포넌트에게 넘겨주지 않기 때문이다 —
 * `componentDidCatch` 는 클래스에만 있다.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  /*
    삼켜 놓고 조용히 넘어가지 않는다. 화면은 대신할 것을 세우되, 콘솔에는 어느 자리에서 무엇이
    터졌는지 남긴다 — 이 장치의 목적은 오류를 감추는 것이 아니라 **번지지 않게** 하는 것이다.
  */
  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error(`[${this.props.label ?? 'ErrorBoundary'}] 렌더 중 오류`, error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    const { children, fallback, label } = this.props;

    if (!error) return children;

    if (fallback) return fallback;

    return (
      <div className={styles.broken} role="status">
        <p className={styles.broken__title}>
          {label ? `${label}을 불러오지 못했습니다` : '이 영역을 불러오지 못했습니다'}
        </p>
        <p className={styles.broken__note}>다른 영역은 그대로 조회됩니다.</p>
      </div>
    );
  }
}
