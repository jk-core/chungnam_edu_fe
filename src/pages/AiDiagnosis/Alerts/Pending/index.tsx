import styles from '../Alerts.module.scss';
import { ActionGuide } from './components/ActionGuide';
import { PendingList } from './components/PendingList';
import { PendingToolbar } from './components/PendingToolbar';

/** 미조치 알림 (SFR-022-05) */
function PendingView() {
  return (
    <div className={styles.tab}>
      <PendingToolbar />
      <PendingList />
      <ActionGuide />
    </div>
  );
}

export default PendingView;
