import { buildPath } from '@/routes/buildPath';
import { useScopeRoute } from './useScopeRoute';

/**
 * 발전통계의 조회 뎁스를 주소로 잡아 준다 (SFR-007).
 * 인버터까지만 다루는 화면이라 스트링은 그 위 인버터로 접어 넣는다.
 */
export function useStatisticsScopeRoute() {
  useScopeRoute({ build: buildPath.energyStatistics });
}
