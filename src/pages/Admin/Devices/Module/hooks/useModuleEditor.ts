import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  deleteManageSolaModule,
  getManageSolaModuleDetail,
  postManageSolaModule,
  putManageSolaModule,
} from '@/service/module';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import { MSG } from '@/configs/messages';
import { queryKeys } from '@/service/queryKeys';
import { serverMessageOf } from '@/service/error';
import { toast } from '@/stores/toastStore';
import type { ModuleFormValues } from '../components/form';

/** 모듈 제품 등록·수정·삭제 (SFR-017-05) */
export function useModuleEditor(moduleId: number | null) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const backTo = listPath('devices', 'module');

  const { data: target, isLoading } = useQuery({
    queryKey: queryKeys.manage.module.detail(moduleId ?? 0),
    queryFn: () => getManageSolaModuleDetail(moduleId ?? 0),
    enabled: moduleId !== null,
  });

  const done = (message: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.manage.module.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.changeHistory.byTarget('MODULE') });
    toast.success(message);
    navigate(backTo);
  };

  const save = useMutation({
    mutationFn: async (values: ModuleFormValues) => {
      if (moduleId === null) await postManageSolaModule(values);
      else await putManageSolaModule({ ...values, moduleId });
    },
    onSuccess: (_data, values) => done(moduleId === null
      ? MSG.createSuccess('모듈 제품')
      : MSG.updateSuccess(values.moduleName)),
    onError: (error) => toast.error(serverMessageOf(error) ?? '모듈 제품을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'),
  });

  const remove = useMutation({
    mutationFn: () => deleteManageSolaModule(moduleId ?? 0),
    onSuccess: () => done(MSG.deleteSuccess(target?.moduleName ?? '모듈 제품')),
    onError: (error) => toast.error(serverMessageOf(error) ?? '모듈 제품을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.'),
  });

  return { target, isLoading, save, remove, backTo };
}
