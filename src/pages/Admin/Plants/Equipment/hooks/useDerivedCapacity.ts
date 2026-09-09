import { useEffect, useRef } from 'react';
import { useWatch } from 'react-hook-form';
import { computeEquipmentCapacity } from '@/mocks/deviceMaster';
import type { EquipmentFormValues } from '@/service/equipment/type';
import type { ModuleProduct } from '@/interface/deviceMaster';
import type { UseFormReturn } from 'react-hook-form';

/**
 * 모듈·직병렬을 만지면 설비용량을 다시 셈해 채운다 (SFR-016-03).
 *
 * 서버는 `equipmentCapacity` 를 값으로 받으므로 폼이 그 값을 들고 있어야 한다 — 자동으로 채우되 현장
 * 실측이 다르면 손으로 고칠 수 있게 둔다. 용량 칸 자체는 보지 않으므로 손으로 고친 값은
 * 직병렬·모듈을 다시 만질 때까지 그대로 남는다.
 */
export function useDerivedCapacity(methods: UseFormReturn<EquipmentFormValues>, modules: ModuleProduct[]) {
  const { control, setValue, getValues } = methods;
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

  const wattPerPanel = modules.find((item) => item.moduleId === moduleId)?.wattPerPanel;
  // 수정 화면을 열 때, 저장돼 있던 손댄 용량을 첫 렌더에서 계산값으로 덮지 않는다.
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!hasSynced.current) {
      hasSynced.current = true;

      return;
    }

    if (wattPerPanel === undefined) return;

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
  }, [series1, parallel1, series2, parallel2, wattPerPanel, setValue, getValues]);
}
