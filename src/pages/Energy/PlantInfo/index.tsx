import { PlantInfoBoard } from './components/PlantInfoBoard';

/**
 * 발전소 정보 (SFR-016-01/02, SFR-017-01/02/04~06 의 조회 쪽).
 *
 * 등록 제원과 설비 구성은 지금까지 관리자 콘솔의 등록·수정 폼 안에만 있었다. 관리자가 아닌
 * 사람은 볼 길이 없었고, 관리자도 값 하나 확인하려면 편집 화면을 열어야 했다. 고치는 일과
 * 보는 일을 갈라, 보는 쪽을 발전관리 아래 한 장으로 편다.
 */
function PlantInfoPage() {
  return <PlantInfoBoard />;
}

export default PlantInfoPage;
