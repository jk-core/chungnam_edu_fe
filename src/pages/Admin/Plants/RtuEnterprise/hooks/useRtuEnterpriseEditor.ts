import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  deleteManageRtuEnterprise,
  getManageRtuEnterpriseDetail,
  postManageRtuEnterprise,
  putManageRtuEnterprise,
} from '@/service/rtuEnterprise';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import { MSG } from '@/configs/messages';
import { queryKeys } from '@/service/queryKeys';
import { serverMessageOf } from '@/service/error';
import { toast } from '@/stores/toastStore';
import type { RtuEnterpriseFormValues } from '../components/form';

/**
 * RTU 업체 등록·수정·삭제 (SFR-016-01).
 *
 * 폼은 주소의 번호로 바로 열리므로 고칠 값을 목록에서 찾지 않고 상세로 받는다 —
 * 목록을 거치면 3쪽에 있던 업체를 주소로 열었을 때 빈 폼이 뜬다.
 */
export function useRtuEnterpriseEditor(rtuEnterpriseId: number | null) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const backTo = listPath('plants', 'rtu-enterprise');

  const { data: target, isLoading } = useQuery({
    queryKey: queryKeys.manage.rtuEnterprise.detail(rtuEnterpriseId ?? 0),
    queryFn: () => getManageRtuEnterpriseDetail(rtuEnterpriseId ?? 0),
    enabled: rtuEnterpriseId !== null,
  });

  const done = (message: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.manage.rtuEnterprise.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.changeHistory.byTarget('RTU_ENTERPRISE') });
    toast.success(message);
    navigate(backTo);
  };

  const save = useMutation({
    mutationFn: async (values: RtuEnterpriseFormValues) => {
      if (rtuEnterpriseId === null) await postManageRtuEnterprise(values);
      else await putManageRtuEnterprise({ ...values, rtuEnterpriseId });
    },
    onSuccess: (_data, values) => done(rtuEnterpriseId === null
      ? MSG.createSuccess('RTU업체')
      : MSG.updateSuccess(values.rtuEnterpriseName)),
    onError: (error) => toast.error(serverMessageOf(error) ?? 'RTU업체를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'),
  });

  const remove = useMutation({
    mutationFn: () => deleteManageRtuEnterprise(rtuEnterpriseId ?? 0),
    onSuccess: () => done(MSG.deleteSuccess(target?.rtuEnterpriseName ?? 'RTU업체')),
    onError: (error) => toast.error(serverMessageOf(error) ?? 'RTU업체를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.'),
  });

  return { target, isLoading, save, remove, backTo };
}
