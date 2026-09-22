import { useMutation } from '@tanstack/react-query';
import { getOperationHistoryExcel } from '@/service/operationHistory';
import { MSG } from '@/configs/messages';
import { serverMessageOf } from '@/service/error';
import { toast } from '@/stores/toastStore';
import { triggerDownload } from '@/utils/export';

interface ExcelArgs {
  cid: number;
  targetDate: string;
  /** 확장자를 뺀 이름 */
  filename: string;
}

/**
 * 운전이력 엑셀 내려받기 (SFR-010-05).
 *
 * 파일은 서버가 만든다 — 표는 쪽을 나눠 받지만 파일은 그날 전량이라, 화면이 쥔 줄로 짜맞추면
 * 보이는 쪽만 담긴다. 서버가 만드는 데 5초를 상시 넘겨 제한시간도 따로 잡혀 있다.
 */
export function useOperationExcel() {
  const { mutate, isPending } = useMutation({
    mutationFn: ({ cid, targetDate }: ExcelArgs) => getOperationHistoryExcel({ cid, targetDate }),
    onSuccess: (blob, { filename }) => {
      triggerDownload(`${filename}.xlsx`, blob);
      toast.success(MSG.downloadStart(filename));
    },
    onError: (error) => toast.error(serverMessageOf(error) ?? '엑셀을 내려받지 못했습니다. 잠시 후 다시 시도해 주세요.'),
  });

  return { downloadExcel: mutate, isPending };
}
