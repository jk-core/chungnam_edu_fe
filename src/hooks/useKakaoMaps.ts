import { useKakaoLoader } from 'react-kakao-maps-sdk';

/**
 * 카카오맵 JavaScript 키. 없으면 지도를 붙이지 않고 내장 SVG 지도로 되돌아간다 —
 * 목업 시연이 키 없이도 돌아가야 하고, 현장 인터넷망에서 외부 API 를 부를 수 있는지도
 * 아직 확인 전이다 (2026-08-04 회의, 발주처 확인 사항).
 *
 * 키는 카카오 디벨로퍼스 > 내 애플리케이션 > 앱 키 > **JavaScript 키**를 쓰고,
 * 플랫폼 > Web 에 서비스 도메인을 등록해야 타일이 내려온다.
 */
export const KAKAO_MAP_KEY = import.meta.env.VITE_KAKAO_MAP_KEY as string | undefined;

export type KakaoMapsStatus = 'absent' | 'loading' | 'ready' | 'failed';

/**
 * 왜 못 실었는지 개발 중에만 알린다.
 *
 * 실패하면 내장 SVG 지도로 조용히 넘어가므로, 알리지 않으면 "카카오맵을 붙였는데 왜 안 뜨지"
 * 를 코드에서 찾게 된다. 열에 아홉은 코드가 아니라 콘솔에 도메인을 등록하지 않은 것이다.
 */
let explained = false;

function explain(): void {
  if (!import.meta.env.DEV || explained) return;

  explained = true;

  // 개발 중에만 나가는 안내다 — 배포 번들에는 위 가드로 걸러진다.
  // eslint-disable-next-line no-console
  console.warn(
    '[지도] 카카오맵 SDK 를 싣지 못해 내장 SVG 지도로 갑니다.\n'
    + '- 키: VITE_KAKAO_MAP_KEY 에 JavaScript 키가 들어 있는지 (.env 를 고쳤으면 dev 서버 재시작)\n'
    + `- 도메인: 카카오 디벨로퍼스 > 내 애플리케이션 > 플랫폼 > Web 에 ${window.location.origin} 등록`,
  );
}

/**
 * 카카오맵을 쓸 수 있는지 알려 준다. `ready` 가 아니면 부르는 쪽이 내장 지도로 간다.
 *
 * SDK 를 싣는 일은 `react-kakao-maps-sdk` 가 맡는다 — 화면이 여럿이어도 한 번만 싣고
 * 그 결과를 나눠 쓴다. 여기서는 그 결과를 이 프로젝트가 쓰는 네 가지 상태로 옮겨 준다.
 */
export function useKakaoMaps(): KakaoMapsStatus {
  // 훅은 조건부로 부를 수 없어 키가 없을 때도 부른다 — 아래에서 결과를 무시한다.
  const [loading, error] = useKakaoLoader({ appkey: KAKAO_MAP_KEY ?? '' });

  if (!KAKAO_MAP_KEY) return 'absent';
  if (loading) return 'loading';

  /*
    다 실었다는 말만 믿지 않고 생성자가 섰는지까지 본다.
    도메인이 막히거나 요청이 끊기면 로더는 "끝났다"고 하면서도 `kakao.maps` 를 남기지 않는다 —
    그 상태로 지도를 그리면 빈 상자만 남는다.
  */
  if (error || typeof window.kakao?.maps?.Map !== 'function') {
    explain();

    return 'failed';
  }

  return 'ready';
}
