/*
  조회 범위 (SFR-023-02/03).

  범위는 `/user/userInfo` 의 `powerPlantIds` 가 정한다 — **빈 배열이 「제한 없음」**이다.
  BE 가 아직 그 칸을 내려주지 않아 지금은 늘 비어 있고, 따라서 아무도 가려지지 않는다.

  값이 실리기 시작하면 두 곳이 함께 살아난다: 여기서 담당 발전소 id 로 옮기고,
  담아 둔 선택이 그 밖이면 되돌린다. 발전소 목록이 API 로 바뀐 뒤에 이어 붙일 자리다.
*/

/** 배열을 매번 새로 만들면 이것을 의존성으로 쓰는 effect 가 렌더마다 다시 돈다. */
const NONE: string[] = [];

/** 담아 둔 선택이 권한 밖이면 담당 발전소로 되돌린다 (SFR-023-03). */
export function useScopeClamp() {
  // 담당 발전소가 오기 시작하면 여기서 selectNode 로 되돌린다.
}

/** 지금 계정이 조회할 수 있는 발전소 id 목록. 비어 있으면 이 축으로는 좁히지 않는다. */
export function useAllowedPlantIds(): string[] {
  return NONE;
}
