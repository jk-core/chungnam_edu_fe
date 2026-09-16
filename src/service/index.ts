import axios from 'axios';

/*
  BE 주소는 배포 시 Dockerfile 이 넘긴다 — 비어 있으면 같은 호스트로 붙는다.
  경로의 판 번호(v2.0)는 여기 한 곳에만 적는다: 도메인마다 적으면 판이 오를 때 스물몇 곳을 고쳐야 한다.
*/
const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_APP_API_PATH ?? ''}/api/v2.0`,
  timeout: 5000,
});

export default apiClient;
