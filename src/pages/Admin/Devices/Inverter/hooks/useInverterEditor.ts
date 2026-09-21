import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  deleteManageInverter,
  getManageInverterDetail,
  postManageInverter,
  putManageInverter,
} from '@/service/inverter';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import { MSG } from '@/configs/messages';
import { queryKeys } from '@/service/queryKeys';
import { serverMessageOf } from '@/service/error';
import { toast } from '@/stores/toastStore';
import type { InverterFormValues } from '../components/form';

/** 인버터 제품 등록·수정·삭제 (SFR-017-04) */
export function useInverterEditor(inverterId: number | null) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const backTo = listPath('devices', 'inverter');

  const { data: target, isLoading } = useQuery({
    queryKey: queryKeys.manage.inverter.detail(inverterId ?? 0),
    queryFn: () => getManageInverterDetail(inverterId ?? 0),
    enabled: inverterId !== null,
  });

  const done = (message: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.manage.inverter.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.changeHistory.byTarget('INVERTER') });
    toast.success(message);
    navigate(backTo);
  };

  const save = useMutation({
    mutationFn: async (values: InverterFormValues) => {
      if (inverterId === null) await postManageInverter(values);
      else await putManageInverter({ ...values, inverterId });
    },
    onSuccess: (_data, values) => done(inverterId === null
      ? MSG.createSuccess('인버터 제품')
      : MSG.updateSuccess(values.inverterName)),
    onError: (error) => toast.error(serverMessageOf(error) ?? '인버터 제품을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'),
  });

  const remove = useMutation({
    mutationFn: () => deleteManageInverter(inverterId ?? 0),
    onSuccess: () => done(MSG.deleteSuccess(target?.inverterName ?? '인버터 제품')),
    onError: (error) => toast.error(serverMessageOf(error) ?? '인버터 제품을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.'),
  });

  return { target, isLoading, save, remove, backTo };
}
