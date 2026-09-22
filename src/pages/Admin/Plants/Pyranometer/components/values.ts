import type { ManageIrradDetail } from '@/service/irrad/type';
import type { IrradFormValues } from './form';

export const EMPTY_VALUES: IrradFormValues = {
  // 빈 숫자 칸은 NaN 이다 — 0 은 「0번 발전소」라는 뜻이 되어 버린다.
  powerPlantId: Number.NaN,
  irradName: '',
  calibrationFactor: 1,
  rtuCommunicationId: '',
  isModTemp: true,
  etc: '',
};

export function toFormValues(target: ManageIrradDetail): IrradFormValues {
  return {
    powerPlantId: target.powerPlantId,
    irradName: target.irradName,
    calibrationFactor: target.calibrationFactor,
    rtuCommunicationId: target.rtuCommunicationId,
    isModTemp: target.isModTemp,
    etc: target.etc,
  };
}
