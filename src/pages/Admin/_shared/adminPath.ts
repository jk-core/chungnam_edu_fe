/*
  관리자 콘솔 주소.

  등록·수정 폼이 모달이 아니라 페이지라, 서브탭까지 주소에 실어야 새로고침·뒤로가기·링크
  공유가 산다.

  **식별자는 path 가 아니라 queryString 으로 넘긴다** — 사내 컨벤션이 path variable 을
  쓰지 않는다([company/api-conventions.md]). 주소를 이어 붙이는 자리가 열 곳 넘게 흩어지면
  한 곳만 어긋나도 빈 화면이 뜨므로 여기서만 만든다.
*/

/** 지금 목록을 보는지 폼을 보는지 — 주소가 정한다 */
export type AdminDepth = 'list' | 'form';

/** 목록. 서브탭이 없는 갈래는 `kind` 를 비운다 */
export function listPath(tab: string, kind?: string): string {
  return kind ? `/admin/${tab}/${kind}` : `/admin/${tab}`;
}

/** 등록 폼 */
export function createPath(tab: string, kind?: string): string {
  return `${listPath(tab, kind)}/new`;
}

/** 수정 폼. `key` 는 그 갈래의 서버 식별자 이름을 그대로 쓴다 (powerPlantId·cid·userId …) */
export function editPath(tab: string, kind: string | undefined, key: string, id: string | number): string {
  return `${listPath(tab, kind)}/edit?${key}=${id}`;
}
