import axios from 'axios';

/*
  BE 주소는 배포 시 Dockerfile 이 넘긴다 — 비어 있으면 같은 호스트로 붙는다.
  엑셀·인쇄처럼 서버가 파일을 만들어 주는 호출은 5초를 상시 넘겨, 그 자리에서만 따로 늘린다.
*/
const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_APP_API_PATH ?? ''}/api/v1.0`,
  timeout: 5000,
});

/** 서버가 파일을 만들어 내려주는 호출의 제한시간 */
export const FILE_TIMEOUT = 300000;

export default apiClient;
