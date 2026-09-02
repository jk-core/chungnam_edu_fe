import { MSG } from '@/configs/messages';
import { OPERATION_LABEL } from '@/mocks/status';
import { exportCsv } from '@/utils/export';
import { formatShort } from '@/utils/date';
import { toast } from '@/stores/toastStore';
import type { AlertRecord } from '@/interface/alert';
import type { CsvColumn } from '@/utils/export';
import type { DateRangeValue } from '@/components/common/DateRangePicker';

/** 표에는 자리가 없어 줄인 항목까지 그대로 담는다 (SFR-022-03). */
const CSV_COLUMNS: CsvColumn<AlertRecord>[] = [
  { header: '알림시간', value: (row) => row.occurredAt },
  { header: '발전소', value: (row) => row.schoolName },
  { header: '설비명', value: (row) => row.deviceName },
  { header: '심각도', value: (row) => OPERATION_LABEL[row.status] },
  { header: '알림원인', value: (row) => row.title },
  { header: '고장코드', value: (row) => row.faultCode ?? '' },
  { header: '조치여부', value: (row) => (row.handled ? '조치완료' : '미조치') },
  { header: '조치완료 시간', value: (row) => row.resolvedAt ?? '' },
  { header: '조치자', value: (row) => row.handler ?? '' },
];

/** 지금 걸린 조건 그대로 내려받는다. 빈 목록은 파일을 만들지 않고 알린다. */
export function downloadAlerts(rows: AlertRecord[], label: string, range: DateRangeValue) {
  if (rows.length === 0) {
    toast.error(MSG.noResult);

    return;
  }

  // range 는 Date 라 그대로 쓰면 파일명에 요일·시간대까지 붙는다.
  const filename = `알림이력_${label}_${formatShort(range.start)}~${formatShort(range.end)}`;

  exportCsv(filename, CSV_COLUMNS, rows);
  toast.success(MSG.downloadStart(filename));
}
