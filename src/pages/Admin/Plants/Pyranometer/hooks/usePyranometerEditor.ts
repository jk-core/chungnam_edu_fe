import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  deleteManageIrrad,
  getManageIrradDetail,
  postManageIrrad,
  putManageIrrad,
} from '@/service/irrad';
import { IRRAD_RTU_PORT } from '@/configs/rtu';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import { MSG } from '@/configs/messages';
import { queryKeys } from '@/service/queryKeys';
import { serverMessageOf } from '@/service/error';
import { toast } from '@/stores/toastStore';
import type { IrradFormValues } from '../components/form';

/**
 * 일사량계 등록·수정·삭제 (SFR-016-01).
 * 포트는 화면에서 고를 수 없지만 서버가 필수로 받아, 보낼 때 고정값을 얹는다.
 */
export function usePyranometerEditor(irradId: number | null) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const backTo = listPath('plants', 'pyranometer');

  const { data: target, isLoading } = useQuery({
    queryKey: queryKeys.manage.irrad.detail(irradId ?? 0),
    queryFn: () => getManageIrradDetail(irradId ?? 0),
    enabled: irradId !== null,
  });

  const done = (message: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.manage.irrad.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.changeHistory.byTarget('IRRAD') });
    toast.success(message);
    navigate(backTo);
  };

  const save = useMutation({
    mutationFn: async (values: IrradFormValues) => {
      const params = { ...values, etc: values.etc.trim(), rtuPort: IRRAD_RTU_PORT };

      if (irradId === null) await postManageIrrad(params);
      else await putManageIrrad({ ...params, irradId });
    },
    onSuccess: (_data, values) => done(irradId === null
      ? MSG.createSuccess('일사량계')
      : MSG.updateSuccess(values.irradName)),
    onError: (error) => toast.error(serverMessageOf(error) ?? '일사량계를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'),
  });

  const remove = useMutation({
    mutationFn: () => deleteManageIrrad(irradId ?? 0),
    onSuccess: () => done(MSG.deleteSuccess(target?.irradName ?? '일사량계')),
    onError: (error) => toast.error(serverMessageOf(error) ?? '일사량계를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.'),
  });

  return { target, isLoading, save, remove, backTo };
}
