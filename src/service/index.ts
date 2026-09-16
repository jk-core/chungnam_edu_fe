import axios from 'axios';
import { clearSession, getSession, setAccessToken } from '@/stores/authStore';
import type { InternalAxiosRequestConfig } from 'axios';

/*
  BE 주소는 배포 시 Dockerfile 이 넘긴다 — 비어 있으면 같은 호스트로 붙는다.
  경로의 판 번호(v2.0)는 여기 한 곳에만 적는다: 도메인마다 적으면 판이 오를 때 스물몇 곳을 고쳐야 한다.
*/
const BASE_URL = `${import.meta.env.VITE_APP_API_PATH ?? ''}/api/v2.0`;

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
});

/**
 * 토큰을 들고 가지 않는 길. 로그인은 아직 토큰이 없고, 재발급은 만료된 토큰으로 부르므로
 * 여기서 401 을 만나도 다시 재발급하러 가면 안 된다 — 그 길이 곧 무한 루프다.
 */
const PUBLIC_PATHS = ['/user/signIn', '/user/reissuance'];

const isPublic = (url: string | undefined) => PUBLIC_PATHS.some((path) => url?.startsWith(path));

apiClient.interceptors.request.use((config) => {
  const session = getSession();

  if (session && !isPublic(config.url)) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }

  return config;
});

/*
  재발급은 한 번에 한 건만 돈다. 화면이 여러 조회를 동시에 띄운 채 토큰이 만료되면 401 이
  한꺼번에 오는데, 각자 재발급하면 마지막 것만 살아남고 앞의 토큰들은 그 자리에서 무효가 된다.
*/
let refreshing: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
  refreshing ??= (async () => {
    const session = getSession();

    if (!session) throw new Error('재발급할 세션이 없습니다.');

    // apiClient 로 부르면 이 인터셉터를 다시 타므로 맨 axios 로 나간다.
    const { data } = await axios.post<string>(`${BASE_URL}/user/reissuance`, {
      refreshToken: session.refreshToken,
      refreshTokenId: session.refreshTokenId,
    });

    setAccessToken(data);

    return data;
  })().finally(() => {
    refreshing = null;
  });

  return refreshing;
}

/** 한 요청이 재발급을 거쳐 다시 나갔는지 — 두 번째 401 은 그대로 떨군다 */
type RetriableConfig = InternalAxiosRequestConfig & { isRetried?: boolean };

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error)) throw error;

    const config = error.config as RetriableConfig | undefined;

    if (error.response?.status !== 401 || !config || config.isRetried || isPublic(config.url)) {
      throw error;
    }

    try {
      const accessToken = await refreshAccessToken();

      config.isRetried = true;
      config.headers.Authorization = `Bearer ${accessToken}`;

      return await apiClient.request(config);
    } catch {
      // 재발급까지 막혔으면 들고 있던 세션이 더는 쓸모가 없다. 화면은 가드가 로그인으로 보낸다.
      clearSession();

      throw error;
    }
  },
);

export default apiClient;
