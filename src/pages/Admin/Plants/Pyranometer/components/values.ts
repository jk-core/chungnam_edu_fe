import type { IrradFormValues } from '@/service/irrad/type';
import type { PlantAsset } from '@/interface/asset';
import type { Pyranometer } from '@/interface/deviceMaster';

export const EMPTY_VALUES: IrradFormValues = {
  // 빈 숫자 칸은 NaN 이다 — 0 은 「0번 발전소」라는 뜻이 되어 버린다.
  powerPlantId: Number.NaN,
  irradName: '',
  calibrationFactor: 1,
  rtuCommunicationId: '',
  isModTemp: true,
  etc: '',
};

export function toFormValues(target: Pyranometer, plants: PlantAsset[]): IrradFormValues {
  return {
    powerPlantId: plants.find((item) => item.plantId === target.plantId)?.powerPlantId ?? Number.NaN,
    irradName: target.name,
    calibrationFactor: target.calibrationFactor,
    rtuCommunicationId: target.rtuCommId,
    isModTemp: target.hasModuleThermometer,
    etc: target.note,
  };
}
