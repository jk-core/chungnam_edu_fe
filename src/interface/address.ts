/**
 * 주소 검색이 돌려주는 한 건.
 *
 * 카카오(다음) 우편번호 서비스의 `onComplete` 결과에서 발전소 등록이 쓰는 것만 추렸다 —
 * 필드 이름을 그쪽 규격 그대로 두어, SDK 를 붙일 때 옮겨 담는 자리가 생기지 않게 한다.
 */
export interface AddressResult {
  /** 우편번호 (zonecode) */
  zonecode: string;
  /** 도로명 주소 (roadAddress) */
  roadAddress: string;
  /** 지번 주소 (jibunAddress) */
  jibunAddress: string;
  /**
   * 시·군·구 코드 (sigunguCode) — 5자리.
   * 화면에 세우지 않고 그대로 서버의 `regionCode` 로 보낸다.
   */
  sigunguCode: string;
  /** 건물 이름 (buildingName). 없는 주소도 많다 */
  buildingName: string;
}
