/*
  쿼리 키를 한 곳에 모은다.

  변경 뒤 무효화할 대상을 화면마다 문자열로 적으면 어느 것이 안 지워졌는지 추적할 길이 없다.
  도메인마다 가장 넓은 키(`all`)를 두어 그 아래를 통째로 지울 수 있게 한다.
*/

const user = ['user'] as const;
const powerPlant = ['powerPlant'] as const;
const calendar = ['calendar'] as const;
const area = ['area'] as const;

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
  calendar: {
    all: calendar,
    month: (powerPlantId: number | null) => [...calendar, 'month', powerPlantId] as const,
    day: (powerPlantId: number | null) => [...calendar, 'day', powerPlantId] as const,
  },
};
