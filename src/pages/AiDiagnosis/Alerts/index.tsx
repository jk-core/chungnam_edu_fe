import { useState } from 'react';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import styles from '../AiDiagnosis.module.scss';
import ListView from './List';
import PendingView from './Pending';
import SettingsView from './Settings';
import TimelineView from './Timeline';

/** 네 갈래로 나뉘어 있던 알림 화면을 한자리에서 갈아 본다 (SFR-015, SFR-022). */
type AlertView = 'list' | 'pending' | 'timeline' | 'settings';

const VIEW_OPTIONS: { value: AlertView; label: string }[] = [
  { value: 'list', label: '알림 목록' },
  { value: 'pending', label: '미조치' },
  { value: 'timeline', label: '고장 타임라인' },
  { value: 'settings', label: '알림 설정' },
];

const VIEWS = {
  list: ListView,
  pending: PendingView,
  timeline: TimelineView,
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
