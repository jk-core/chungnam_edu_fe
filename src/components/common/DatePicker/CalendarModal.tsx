import { useCallback } from 'react';
import { Button } from '@/components/common/Button';
import { formatByGranularity } from '@/utils/date';
import { getMonthDays, getYearMonths } from '@/mocks/weather';
import { Modal } from '@/components/common/Modal';
import { ScrollCalendar } from '@/components/common/DataCalendar/ScrollCalendar';
import { usePlantScope } from '@/hooks/usePlantScope';
import type { Granularity } from '@/utils/date';
import styles from './DatePicker.module.scss';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  granularity: Granularity;
  /** 열었을 때 펼칠 자리. 아직 고른 것이 없으면 오늘에서 편다 */
  value: Date | null;
  onSelect: (value: Date) => void;
}

const TITLE: Record<Granularity, string> = {
  day: '일자 선택',
  month: '월 선택',
  year: '연도 선택',
};

const QUICK_LABEL: Record<Granularity, string> = {
  day: '오늘',
  month: '이번 달',
  year: '올해',
};

/*
  달력 칸에 얹는 값은 조회 단위에 따라 갈린다 (SFR-007-01/02, SFR-010-01/02, SFR-022-01/02).
  일 단위는 그 날 날씨, 월·연 단위는 그 기간 발전시간 — 날짜를 고르는 자리라면 어디서든 같다.
*/
const HINT: Record<Granularity, string> = {
  day: '칸마다 그 날 날씨가 함께 나옵니다. 위아래로 굴리면 지난 달과 다음 달이 이어집니다.',
  month: '칸마다 그 달 발전시간이 함께 나옵니다. 위아래로 굴리면 다른 해가 이어집니다.',
  year: '칸마다 그 해 발전시간이 함께 나옵니다. 위아래로 굴리면 지난 해가 이어집니다.',
};

/**
 * 날짜를 고르는 창.
 *
 * 이걸 여는 방아쇠는 자리마다 다르다 — 툴바에서는 알약(`DatePicker`), 폼에서는 옆 입력들과 같은
 * 상자(`Form.Date`). 방아쇠는 각자 갖고 창만 함께 쓴다.
 */
export function CalendarModal({ isOpen, onClose, granularity, value, onSelect }: CalendarModalProps) {
  const { plant } = usePlantScope();

  // 굴려 보는 달력이라 달마다 그때그때 읽어 간다. 조회 대상이 바뀌면 그 발전소 값으로 갈린다.
  const getDays = useCallback(
    (year: number, month: number) => getMonthDays(plant?.id ?? null, year, month),
    [plant?.id],
  );
  const getMonths = useCallback((year: number) => getYearMonths(plant?.id ?? null, year), [plant?.id]);

  const choose = (next: Date) => {
    onSelect(next);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={TITLE[granularity]}
      description={HINT[granularity]}
      footer={
        <div className={styles.footer}>
          <Button variant="ghost" size="sm" onClick={() => choose(new Date())}>
            {QUICK_LABEL[granularity]}
          </Button>
          <span className={styles.footer__current}>
            {value ? formatByGranularity(value, granularity) : '고르지 않음'}
          </span>
        </div>
      }
    >
      <ScrollCalendar
        // 조회 단위가 바뀌면 구간 종류가 달라진다 — 상태를 이어받지 않고 새로 깐다.
        key={granularity}
        granularity={granularity}
        selected={value ?? new Date()}
        onSelect={choose}
        getDays={getDays}
        getMonths={getMonths}
      />
    </Modal>
  );
}
