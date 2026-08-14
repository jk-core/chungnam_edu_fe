import { useState } from 'react';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import styles from '../AiDiagnosis.module.scss';
import ListView from './List';
import PendingView from './Pending';
import SettingsView from './Settings';

/**
 * 알림 화면 (SFR-015, SFR-022).
 *
 * 고장 타임라인은 따로 두지 않는다 — 알림 이력을 표로 볼지 시간 축으로 볼지의 차이일 뿐이라,
 * 목록 안에서 「표 / 타임라인」 으로 갈아 끼운다. 갈래를 하나 줄이면 같은 것을 두 곳에서
 * 찾지 않아도 된다.
 */
type AlertView = 'list' | 'pending' | 'settings';

const VIEW_OPTIONS: { value: AlertView; label: string }[] = [
  { value: 'list', label: '알림 목록' },
  { value: 'pending', label: '미조치' },
  { value: 'settings', label: '알림 설정' },
];

const VIEWS = {
  list: ListView,
  pending: PendingView,
  settings: SettingsView,
} as const;

function AlertsPage() {
  const [view, setView] = useState<AlertView>('list');
  const View = VIEWS[view];

  return (
    <div className={styles.tab}>
      <div className={styles.toolbar}>
        <SegmentedControl label="알림 보기" options={VIEW_OPTIONS} value={view} onChange={setView} />
      </div>

      <View />
    </div>
  );
}

export default AlertsPage;
