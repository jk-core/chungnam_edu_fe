# 결정 로그

코드가 스스로 말하지 못하는 판단만 남긴다. 결론과 남은 판단만 적고 경위는 쓰지 않는다.

## 등록 정보 변경 이력 — diff 를 누가 계산하는가 (BE 확정 대기)

`GET /manage/history` 의 응답 모양이 두 안으로 갈린다. **1안으로 구현했고** BE 와 정한 뒤 2안을 지운다.

- **1안 (채택)** — BE 가 바뀐 항목만 추려 준다. `changeList: [{ fieldName, beforeValue, afterValue }]`
- **2안** — 변경 전·후 엔티티를 통째로 준다. `beforeEntity` / `afterEntity: Record<string, string | number | boolean | null> | null`

2안은 BE 구현이 가볍지만 FE 가 넷을 떠안는다.

- 저장할 때마다 바뀌는 감사 컬럼(`updatedDtm`·`updatedUserId`)을 걸러 낼 목록을 FE 가 든다
- FK 를 이름으로 바꿀 수 없다 — `userId` 3 을 담당자명으로 보이려면 사용자 목록을 들고 이어야 한다
- 필드명을 한글 라벨로 옮길 표를 엔티티마다 갖게 되어, 이력 화면이 다시 일곱으로 갈린다
- 0·null·빈 문자열과 날짜 표기 차이를 FE 가 판정해 안 바뀐 것을 바뀐 것으로 그린다

두 안 모두 저장은 `tb_sys_log` 의 `BEFORE_DATA`·`AFTER_DATA` 에 통짜 JSON 으로 남기는 것을 전제한다.
