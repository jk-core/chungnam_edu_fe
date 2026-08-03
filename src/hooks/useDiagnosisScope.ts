import { getNode } from '@/mocks/tree';
import { usePlantScope } from '@/hooks/usePlantScope';
import type { PlantScope } from '@/hooks/usePlantScope';
import type { ScopeNode } from '@/mocks/tree';

export interface DiagnosisScope extends PlantScope {
  /** 진단이 다루는 계층. 채널이 선택돼 있으면 그 위 접속반으로 올려 준다. */
  target: ScopeNode;
  /** 선택 계층이 진단 범위를 벗어나 올려 잡았는지 */
  promoted: boolean;
}

/**
 * 진단이 다룰 수 있는 최말단 계층은 인버터 타입에 따라 다르다.
 * - 스트링형: 스트링까지
 * - 센트럴형: 접속반까지 (채널은 계측값 조회용이라 진단 판정 대상이 아니다)
 *
 * 다른 화면에서 채널을 골라 둔 채로 넘어오면 접속반으로 올려 잡고 그 사실을 알린다.
 */
export function useDiagnosisScope(): DiagnosisScope {
  const scope = usePlantScope();
  const isChannel = scope.node.kind === 'channel';

  return {
    ...scope,
    target: isChannel ? getNode(scope.node.parentId) : scope.node,
    promoted: isChannel,
  };
}
