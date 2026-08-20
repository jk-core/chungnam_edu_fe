import { useMemo } from 'react';
import { INTEGRATION_LOGS } from '@/mocks/integrationLog';
import useAssetStore from '@/stores/assetStore';
import type { IntegrationLog } from '@/interface/integration';

/**
 * 화면에 보이는 전송 이력 (SFR-027-05).
 *
 * 재송신해 회복시킨 건은 「재시도 성공」 으로 올려 보여 준다. 이 승격을 판마다 따로 하면
 * 요약 카드는 실패로 세고 표는 성공으로 적는 일이 생기므로, 목록을 만드는 자리를 하나로 둔다.
 */
export function useIntegrationLogs(): IntegrationLog[] {
  const resentIds = useAssetStore((state) => state.resentIds);

  return useMemo(
    () => INTEGRATION_LOGS.map((log) => (
      log.result === 'fail' && resentIds.includes(log.id)
        ? { ...log, result: 'retried' as const, responseCode: 200, failReason: null }
        : log
    )),
    [resentIds],
  );
}
