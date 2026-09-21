import type { ChangeHistoryTargetType } from '@/service/changeHistory/type';
import type { ManageInverterPageParams } from '@/service/inverter/type';
import type { ManageIrradPageParams } from '@/service/irrad/type';
import type { ManageRtuEnterprisePageParams } from '@/service/rtuEnterprise/type';
import type { ManageSolaModulePageParams } from '@/service/module/type';
import type { ManageStringPageParams } from '@/service/string/type';

/*
  쿼리 키를 한 곳에 모은다.

  변경 뒤 무효화할 대상을 화면마다 문자열로 적으면 어느 것이 안 지워졌는지 추적할 길이 없다.
  도메인마다 가장 넓은 키(`all`)를 두어 그 아래를 통째로 지울 수 있게 한다.
*/

const user = ['user'] as const;
const manage = ['manage'] as const;
const powerPlant = ['powerPlant'] as const;
const calendar = ['calendar'] as const;
const area = ['area'] as const;
const operationHistory = ['operationHistory'] as const;
const home = ['home'] as const;
const changeHistory = ['changeHistory'] as const;

export const queryKeys = {
  user: {
    all: user,
    /** `/user/userInfo` — DB 를 다시 본다 */
    info: () => [...user, 'info'] as const,
    /** `/user/token/Info` — 토큰이 담고 있는 값으로 답한다 */
    byToken: () => [...user, 'token'] as const,
  },
  powerPlant: {
    all: powerPlant,
    /** 도 전체를 한 번에 받는다 — 거르기·쪽나눔은 화면이 한다 */
    list: () => [...powerPlant, 'list'] as const,
    hierarchy: (powerPlantId: number | null) => [...powerPlant, 'hierarchy', powerPlantId] as const,
  },
  area: {
    all: area,
    /** 지역 드롭다운 — 이름으로 좁힐 수 있으나 화면은 전체를 받아 둔다 */
    dropdown: () => [...area, 'dropdown'] as const,
  },
  operationHistory: {
    all: operationHistory,
    /** 엑셀은 명령형 호출이라 키를 두지 않는다 */
    page: (cid: number | null, targetDate: string, page: number, size: number) =>
      [...operationHistory, 'page', cid, targetDate, page, size] as const,
    chart: (cid: number | null, targetDate: string) => [...operationHistory, 'chart', cid, targetDate] as const,
  },
  calendar: {
    all: calendar,
    month: (powerPlantId: number | null) => [...calendar, 'month', powerPlantId] as const,
    day: (powerPlantId: number | null) => [...calendar, 'day', powerPlantId] as const,
  },
  home: {
    all: home,
    /** `/home/hero` — 상단 발전량·출력률·차트·일출·일몰 */
    hero: () => [...home, 'hero'] as const,
    /** `/home/overview` — 설비용량·금일/전일 발전량·발전시간 */
    overview: () => [...home, 'overview'] as const,
    /** `/home/region` — 전국 시도별 평균 발전시간 */
    region: () => [...home, 'region'] as const,
  },
  changeHistory: {
    all: changeHistory,
    /** `/manage/changeHistory` — 대상 타입별 최근 10건 */
    byTarget: (targetType: ChangeHistoryTargetType) => [...changeHistory, targetType] as const,
  },
  /*
    관리 화면의 등록 정보. 공용 조회(`powerPlant`)와 키 공간을 나눠 둔다 — 같은 발전소라도
    한쪽은 계측이 실린 조회값이고 한쪽은 손으로 고치는 등록값이라, 한 키에 섞이면
    등록을 고친 뒤 조회 화면까지 통째로 다시 받게 된다.
  */
  manage: {
    all: manage,
    rtuEnterprise: {
      all: [...manage, 'rtuEnterprise'] as const,
      page: (param: ManageRtuEnterprisePageParams) => [...manage, 'rtuEnterprise', 'page', param] as const,
      detail: (rtuEnterpriseId: number) => [...manage, 'rtuEnterprise', 'detail', rtuEnterpriseId] as const,
    },
    inverter: {
      all: [...manage, 'inverter'] as const,
      page: (param: ManageInverterPageParams) => [...manage, 'inverter', 'page', param] as const,
      detail: (inverterId: number) => [...manage, 'inverter', 'detail', inverterId] as const,
    },
    module: {
      all: [...manage, 'module'] as const,
      page: (param: ManageSolaModulePageParams) => [...manage, 'module', 'page', param] as const,
      detail: (moduleId: number) => [...manage, 'module', 'detail', moduleId] as const,
    },
    irrad: {
      all: [...manage, 'irrad'] as const,
      page: (param: ManageIrradPageParams) => [...manage, 'irrad', 'page', param] as const,
      detail: (irradId: number) => [...manage, 'irrad', 'detail', irradId] as const,
    },
    /** 스트링은 설비(cid) 단위로 한 판씩 다룬다 — 상세 키도 스트링이 아니라 설비를 가리킨다 */
    string: {
      all: [...manage, 'string'] as const,
      page: (param: ManageStringPageParams) => [...manage, 'string', 'page', param] as const,
      detail: (cid: number) => [...manage, 'string', 'detail', cid] as const,
    },
  },
};
