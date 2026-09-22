import { useEffect } from 'react';
import { useWatch } from 'react-hook-form';
import { computeEquipmentCapacity } from '@/mocks/deviceMaster';
import type { SolaModuleDetail } from '@/service/module/type';
import type { EquipmentFormValues } from '../components/form';
import type { UseFormReturn } from 'react-hook-form';

/**
 * 모듈·직병렬을 만지면 설비용량을 다시 셈해 채운다 (SFR-016-03).
 *
 * 서버는 `equipmentCapacity` 를 값으로 받으므로 폼이 그 값을 들고 있어야 한다 — 자동으로 채우되 현장
 * 실측이 다르면 손으로 고칠 수 있게 둔다. 용량 칸 자체는 보지 않으므로 손으로 고친 값은
 * 직병렬·모듈을 다시 만질 때까지 그대로 남는다.
 */
export function useDerivedCapacity(methods: UseFormReturn<EquipmentFormValues>, modules: SolaModuleDetail[]) {
  const { control, setValue, getValues, formState } = methods;
  const [series1, parallel1, series2, parallel2, moduleId] = useWatch({
    control,
    name: [
      'moduleSerialCount',
      'moduleParallelCount',
      'moduleSerialCountSecond',
      'moduleParallelCountSecond',
      'moduleId',
    ],
  });

  const wattPerPanel = modules.find((item) => item.moduleId === moduleId)?.pwrMp;

  /*
    저장돼 있던 손댄 용량을 화면을 여는 것만으로 계산값에 덮이게 두지 않는다.
    「첫 렌더만 건너뛴다」로는 못 막는다 — 모듈 제원이 서버에서 오므로 계산이 가능해지는 것은
    두 번째 렌더다. 그래서 사용자가 구성을 실제로 만졌는지로 가른다.
  */
  const { dirtyFields } = formState;
  const isTouched = Boolean(
    dirtyFields.moduleId
    || dirtyFields.moduleSerialCount
    || dirtyFields.moduleParallelCount
    || dirtyFields.moduleSerialCountSecond
    || dirtyFields.moduleParallelCountSecond,
  );

  useEffect(() => {
    if (!isTouched || wattPerPanel === undefined) return;

    const zeroed = (value: number) => (Number.isNaN(value) ? 0 : value);
    const capacity = computeEquipmentCapacity({
      series1: zeroed(series1),
      parallel1: zeroed(parallel1),
      series2: zeroed(series2),
      parallel2: zeroed(parallel2),
    }, wattPerPanel);
    const next = Math.round(capacity * 1000) / 1000;

    if (getValues('equipmentCapacity') === next) return;

    setValue('equipmentCapacity', next, { shouldValidate: true, shouldDirty: true });
  }, [isTouched, series1, parallel1, series2, parallel2, wattPerPanel, setValue, getValues]);
}
