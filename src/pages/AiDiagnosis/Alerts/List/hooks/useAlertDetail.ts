import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ALERT_RECORDS } from '@/mocks/alerts';
import type { AlertRecord } from '@/interface/alert';

/**
 * 상세 창에 무엇을 띄울지.
 *
 * 표에서 고른 건과 헤더 종에서 건너온 건, 두 갈래가 같은 창을 쓴다.
 * 종은 어느 화면에서나 도 전체를 가리키지만 이 목록은 조회 대상과 기간으로 거른다 —
 * 누른 알림이 목록에 없을 수 있으므로, 걸러진 결과가 아니라 원본에서 그 건을 찾는다.
 * 주소를 상태로 옮겨 담지 않고 그때그때 읽는다. 옮겨 담으면 주소와 화면이 어긋날 자리가 생긴다.
 */
export function useAlertDetail() {
  const [selected, setSelected] = useState<AlertRecord | null>(null);
  const [params, setParams] = useSearchParams();

  const linkedId = params.get('alert');
  const linked = linkedId ? ALERT_RECORDS.find((alert) => alert.id === linkedId) ?? null : null;

  /** 닫으면 주소에서도 지운다 — 남겨 두면 뒤로 갔다 오거나 새로 고칠 때 다시 열린다. */
  const close = () => {
    setSelected(null);

    if (!linkedId) return;

    params.delete('alert');
    setParams(params, { replace: true });
  };

  return { detail: selected ?? linked, open: setSelected, close };
}
