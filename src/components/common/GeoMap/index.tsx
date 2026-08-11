import { useKakaoMaps } from '@/hooks/useKakaoMaps';
import { KakaoGeoMap } from './KakaoGeoMap';
import { SvgGeoMap } from './SvgGeoMap';
import type { GeoMapProps } from './types';

export type { GeoMapProps };

/**
 * 설비 지도 (SFR-007-05~10).
 *
 * 카카오맵 키가 있고 SDK 가 제대로 실려야 실지도를 쓴다. 그 밖에는 — 키가 없거나,
 * 학교망에서 외부 호출이 막혔거나, 키가 거부돼 지도가 그려지지 않거나 — 내장 SVG 지도로 간다.
 * 시연이 외부망 상태에 걸려 멈추지 않게 하려는 것이다
 * (2026-08-04 회의, 외부망 허용 여부는 발주처 확인 중).
 */
export function GeoMap(props: GeoMapProps) {
  const status = useKakaoMaps();

  if (status === 'ready') return <KakaoGeoMap {...props} />;

  return <SvgGeoMap {...props} />;
}
