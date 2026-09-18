import { DATA_STATE } from '@/configs/codes';
import type { DataStateCode } from '@/configs/codes';

/**
 * 계측값이 아예 오지 않은 상태.
 *
 * 「값이 이상한」 상태(누적값 감소·임계치 초과 등)와 가른다 — 그쪽은 값이 실제로 왔으므로
 * 그래프에 그대로 그려야 무엇이 이상한지 보인다. 선을 끊는 것은 값이 없는 구간뿐이다.
 */
export const isUnreceived = (code: DataStateCode) =>
  code === DATA_STATE.CODE['TIME-OUT']
  || code === DATA_STATE.CODE.프로토콜에러
  || code === DATA_STATE.CODE['누적값 없음(NULL)'];
