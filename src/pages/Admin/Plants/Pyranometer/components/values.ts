import { SCHOOLS } from '@/mocks/schools';
import type { PyranometerFormValues } from '@/service/pyranometer/type';
import type { Pyranometer } from '@/interface/deviceMaster';

export const EMPTY_VALUES: PyranometerFormValues = {
  plantId: SCHOOLS[0]?.id ?? '',
  name: '',
  calibrationFactor: 1,
  rtuCommId: '',
  moduleThermometer: 'yes',
  note: '',
};

export function toFormValues(target: Pyranometer): PyranometerFormValues {
  return {
    plantId: target.plantId,
    name: target.name,
    calibrationFactor: target.calibrationFactor,
    rtuCommId: target.rtuCommId,
    moduleThermometer: target.hasModuleThermometer ? 'yes' : 'no',
    note: target.note,
  };
}
