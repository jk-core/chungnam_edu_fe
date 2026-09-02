import { RAW_STATE_LABEL } from '@/mocks/operationRaw';
import type { CsvColumn } from '@/utils/export';
import type { OperationRaw } from '@/interface/operation';

/**
 * 엑셀로 내려받는 열 (SFR-010-05).
 *
 * 화면 표는 좁아서 몇 칸만 보여 주지만 파일에는 계측이 실어 온 값을 빠짐없이 담는다 — 받아서
 * 다시 계산하려는 사람이 화면에 없던 값을 찾으러 되돌아오지 않게 한다. 빈 값은 0 이 아니라
 * 빈칸으로 둔다. 0 으로 적으면 「재지 못했다」 와 「0 이었다」 가 구별되지 않는다.
 */
export const HISTORY_CSV_COLUMNS: CsvColumn<OperationRaw>[] = [
  { header: '수집일시', value: (row) => row.at },
  { header: '데이터상태', value: (row) => RAW_STATE_LABEL[row.state] },
  { header: '누적발전량(Wh)', value: (row) => row.accumWh },
  { header: '일사량(W/m2)', value: (row) => row.irradiance ?? '' },
  { header: '모듈온도(C)', value: (row) => row.moduleTemp ?? '' },
  { header: '인버터온도(C)', value: (row) => row.inverterTemp ?? '' },
  { header: '입력전압(V)', value: (row) => row.dcVolt ?? '' },
  { header: '입력전류(A)', value: (row) => row.dcAmp ?? '' },
  { header: '입력전력(W)', value: (row) => row.dcWatt ?? '' },
  { header: '출력전압 R(V)', value: (row) => row.acVoltR ?? row.acVolt ?? '' },
  { header: '출력전압 S(V)', value: (row) => row.acVoltS ?? '' },
  { header: '출력전압 T(V)', value: (row) => row.acVoltT ?? '' },
  { header: '출력전류 R(A)', value: (row) => row.acAmpR ?? row.acAmp ?? '' },
  { header: '출력전류 S(A)', value: (row) => row.acAmpS ?? '' },
  { header: '출력전류 T(A)', value: (row) => row.acAmpT ?? '' },
  { header: '출력전력(W)', value: (row) => row.acWatt ?? '' },
  { header: '주파수(Hz)', value: (row) => row.frequency ?? '' },
  { header: '역률(%)', value: (row) => row.powerFactor ?? '' },
];
