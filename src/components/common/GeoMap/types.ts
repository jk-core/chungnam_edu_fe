import type { School } from '@/interface/energy';
import type { ReactNode } from 'react';

export interface GeoMapProps {
  plants: School[];
  /** 마커를 눌렀을 때 띄울 팝업 본문 */
  renderPopup: (plant: School) => ReactNode;
  selectedId?: string | null;
  onSelect?: (plant: School) => void;
  height?: number;
  /** 지도를 대신 읽을 표. 스크린리더와 인쇄 양쪽에 쓴다. */
  fallback: ReactNode;
}
