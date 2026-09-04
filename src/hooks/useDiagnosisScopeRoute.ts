import { buildPath } from '@/routes/buildPath';
import { useScopeRoute } from './useScopeRoute';

/**
 * AI 진단의 조회 뎁스를 주소로 잡아 준다 (SFR-013).
 * 진단은 인버터 아래 스트링까지 판정하므로 그 자리도 주소에 남긴다.
 */
export function useDiagnosisScopeRoute() {
  useScopeRoute({ build: buildPath.diagnosis, allowUnit: true });
}
