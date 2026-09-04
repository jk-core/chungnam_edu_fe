import { usePlantScope } from '@/hooks/usePlantScope';
import type { PlantScope } from '@/hooks/usePlantScope';
import type { ScopeNode } from '@/mocks/tree';

export interface DiagnosisScope extends PlantScope {
  /** 진단이 다루는 계층. 최말단은 스트링이다. */
  target: ScopeNode;
}

export function useDiagnosisScope(): DiagnosisScope {
  const scope = usePlantScope();

  return { ...scope, target: scope.node };
}
