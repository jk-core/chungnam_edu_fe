import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { deleteManageString, getManageStringDetail, putManageString } from '@/service/string';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import { MSG } from '@/configs/messages';
import { queryKeys } from '@/service/queryKeys';
import { serverMessageOf } from '@/service/error';
import { toast } from '@/stores/toastStore';
import type { StringRow } from '@/schemas/stringRow';

/**
 * 설비 한 대의 스트링 편집판 (SFR-016-01, SFR-017-06).
 *
 * 저장은 판을 통째로 보내되 서버가 `stringId` 없는 줄만 새로 만든다 — **판에서 뺀 줄은
 * 저장으로 지워지지 않는다.** 그래서 저장돼 있는 줄을 빼는 일은 그 자리에서 삭제를 부른다.
 */
export function useStringSheet(cid: number) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const backTo = listPath('plants', 'string');

  const { data: target, isLoading } = useQuery({
    queryKey: queryKeys.manage.string.detail(cid),
    queryFn: () => getManageStringDetail(cid),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.manage.string.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.changeHistory.byTarget('STRING') });
  };

  const save = useMutation({
    mutationFn: (rows: StringRow[]) => putManageString({
      cid,
      list: rows.map(({ stringId, ...rest }) => (stringId === null ? rest : { ...rest, stringId })),
    }),
    onSuccess: () => {
      invalidate();
      toast.success(MSG.updateSuccess(`${target?.equipmentName ?? '설비'} 스트링`));
      navigate(backTo);
    },
    onError: (error) => toast.error(serverMessageOf(error) ?? '스트링을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'),
  });

  /** 저장돼 있는 한 조를 그 자리에서 지운다 — 판을 저장하지 않아도 서버에서 사라진다 */
  const removeOne = useMutation({
    mutationFn: ({ stringId }: { stringId: number; stringName: string }) => deleteManageString(stringId),
    onSuccess: (_data, { stringName }) => {
      invalidate();
      toast.success(MSG.deleteSuccess(stringName));
    },
    onError: (error) => toast.error(serverMessageOf(error) ?? '스트링을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.'),
  });

  const removeAll = useMutation({
    mutationFn: () => Promise.all((target?.list ?? []).map((row) => deleteManageString(row.stringId))),
    onSuccess: () => {
      invalidate();
      toast.success(MSG.deleteSuccess(`${target?.equipmentName ?? '설비'} 스트링`));
      navigate(backTo);
    },
    onError: (error) => toast.error(serverMessageOf(error) ?? '스트링을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.'),
  });

  return { target, isLoading, save, removeOne, removeAll, backTo };
}
