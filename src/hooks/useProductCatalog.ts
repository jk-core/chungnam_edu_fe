import { useQuery } from '@tanstack/react-query';
import { getManageInverterPage } from '@/service/inverter';
import { getSolaModuleList } from '@/service/module';
import { queryKeys } from '@/service/queryKeys';
import type { ManageInverterPage } from '@/service/inverter/type';
import type { SolaModuleDetail } from '@/service/module/type';

/**
 * 설비가 가리키는 제품 카탈로그.
 *
 * 설비 폼의 검색기·설비 목록의 모델명·발전소 정보의 제원이 같은 목록을 본다 — 제품은
 * 수백 건을 넘지 않아 한 번에 받아 두고 화면이 그 위에서 찾는다. 조회는 제품 번호로만
 * 하므로 거를 조건을 서버로 넘길 일이 없다.
 *
 * 인버터는 아직 관리 목록 말고 제품을 통으로 주는 길이 없어 쪽 크기를 넉넉히 잡아 받는다.
 */
const CATALOG_SIZE = 1000;

const NONE_INVERTER: ManageInverterPage[] = [];
const NONE_MODULE: SolaModuleDetail[] = [];

export function useInverterCatalog(): ManageInverterPage[] {
  const { data } = useQuery({
    queryKey: queryKeys.manage.inverter.page({ page: 0, size: CATALOG_SIZE }),
    queryFn: () => getManageInverterPage({ page: 0, size: CATALOG_SIZE }),
    staleTime: 5 * 60 * 1000,
  });

  return data?.content ?? NONE_INVERTER;
}

export function useModuleCatalog(): SolaModuleDetail[] {
  const { data } = useQuery({
    queryKey: queryKeys.equipment.moduleList(),
    queryFn: () => getSolaModuleList(),
    staleTime: 5 * 60 * 1000,
  });

  return data ?? NONE_MODULE;
}
