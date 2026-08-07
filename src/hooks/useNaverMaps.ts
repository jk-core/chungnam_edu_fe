import { useEffect, useState } from 'react';

/**
 * 네이버 지도 API 키. 없으면 지도를 붙이지 않고 내장 SVG 지도로 되돌아간다 —
 * 목업 시연이 키 없이도 돌아가야 하고, 현장 인터넷망에서 외부 API 를 부를 수 있는지도
 * 아직 확인 전이다 (2026-08-04 회의, 발주처 확인 사항).
 */
export const NAVER_MAP_KEY = import.meta.env.VITE_NAVER_MAP_CLIENT_ID as string | undefined;

export type NaverMapsStatus = 'absent' | 'loading' | 'ready' | 'failed';

const SCRIPT_ID = 'naver-maps-sdk';
/** SDK 가 자리를 잡았는지 확인하는 간격과 한도 */
const CHECK_INTERVAL = 120;
const CHECK_TIMEOUT = 2400;

/** 지도를 쓸 수 있는 상태인가 — 네임스페이스가 아니라 생성자까지 본다. */
function usable(): boolean {
  return typeof window.naver?.maps?.Map === 'function';
}

/** 화면이 여럿이어도 스크립트는 한 번만 싣고, 그 결과를 모두가 나눠 쓴다. */
let loading: Promise<boolean> | null = null;

/**
 * SDK 를 싣고 쓸 수 있는지까지 확인한다.
 *
 * `load` 만으로는 판별이 안 된다 — 키가 거부돼도 스크립트는 200 으로 내려오고,
 * `window.naver` 껍데기까지 생겼다가 잠시 뒤 비워진다. 그래서 생성자가 남아 있는지
 * 잠깐 지켜보고, 네이버가 알려 주는 인증 실패 콜백도 함께 받는다.
 */
function loadNaverMaps(): Promise<boolean> {
  if (loading) return loading;

  loading = new Promise<boolean>((resolve) => {
    if (usable()) {
      resolve(true);

      return;
    }

    let timer = 0;
    const settle = (ok: boolean) => {
      window.clearInterval(timer);
      resolve(ok);
    };

    // 네이버가 인증 실패를 알리는 공식 통로. 여기로 들어오면 더 볼 것 없이 내장 지도로 간다.
    window.navermap_authFailure = () => settle(false);

    const watch = () => {
      let waited = 0;

      timer = window.setInterval(() => {
        waited += CHECK_INTERVAL;

        if (usable()) settle(true);
        else if (waited >= CHECK_TIMEOUT) settle(false);
      }, CHECK_INTERVAL);
    };

    const script = document.createElement('script');

    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_MAP_KEY}`;
    script.addEventListener('load', watch);
    script.addEventListener('error', () => settle(false));
    document.head.appendChild(script);
  });

  return loading;
}

/** 네이버 지도를 쓸 수 있는지 알려 준다. `ready` 가 아니면 부르는 쪽이 내장 지도로 간다. */
export function useNaverMaps(): NaverMapsStatus {
  const [status, setStatus] = useState<NaverMapsStatus>(() => {
    if (!NAVER_MAP_KEY) return 'absent';

    return usable() ? 'ready' : 'loading';
  });

  useEffect(() => {
    if (!NAVER_MAP_KEY || status !== 'loading') return;

    let alive = true;

    loadNaverMaps().then((ok) => {
      if (alive) setStatus(ok ? 'ready' : 'failed');
    });

    return () => {
      alive = false;
    };
  }, [status]);

  return status;
}
