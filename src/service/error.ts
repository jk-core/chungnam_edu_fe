import axios from 'axios';

/**
 * 서버가 내려준 실패 문구. BE 는 `{ errorCode, message }` 로 답한다.
 *
 * 로그인 실패 횟수·계정 잠금·지난 비밀번호 재사용처럼 **서버만이 정확히 아는 사정**이
 * 이 문구에 들어 있어, 화면이 지어낸 말로 덮지 않는다. 없을 때 무엇을 보여 줄지는
 * 부르는 쪽이 정한다 — 같은 실패라도 화면마다 할 말이 다르다.
 */
export function serverMessageOf(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined;

  const body: unknown = error.response?.data;

  if (typeof body === 'string') return body;

  if (body !== null && typeof body === 'object' && 'message' in body && typeof body.message === 'string') {
    return body.message;
  }

  return undefined;
}
