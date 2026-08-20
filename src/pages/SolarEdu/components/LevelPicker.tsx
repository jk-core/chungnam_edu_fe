import { useSearchParams } from 'react-router-dom';
import { EDU_LEVEL_LABEL, EDU_LEVELS } from '@/mocks/eduContent';
import { SegmentedControl } from '@/components/common/SegmentedControl';

/** 눈높이를 학교급에 맡기는 값 — 세그먼트에서 고르면 `?level=` 이 붙는다. */
const AUTO = 'auto';

const LEVEL_OPTIONS = [
  { value: AUTO, label: '자동' },
  ...EDU_LEVELS.map((level) => ({ value: level, label: EDU_LEVEL_LABEL[level] })),
];

/**
 * 눈높이 고르기 (SFR-005-04).
 * 수동으로 고른 값은 URL 에 남긴다 — 모니터에 걸어 두는 화면이라 새로고침에도 살아 있어야 한다.
 */
export function LevelPicker() {
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <SegmentedControl
      value={searchParams.get('level') ?? AUTO}
      // 자동은 쿼리를 지워 학교급 매핑으로 되돌린다.
      onChange={(value) => setSearchParams(value === AUTO ? {} : { level: value }, { replace: true })}
      options={LEVEL_OPTIONS}
      label="눈높이 고르기"
      size="sm"
    />
  );
}
