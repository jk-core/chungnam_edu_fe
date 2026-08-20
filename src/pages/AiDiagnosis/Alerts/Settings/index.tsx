import styles from '../Alerts.module.scss';
import { RuleList } from './components/RuleList';
import { SettingNotes } from './components/SettingNotes';

/** 알림 설정 (SFR-022-06) */
function SettingsView() {
  return (
    <div className={styles.tab}>
      <RuleList />
      <SettingNotes />
    </div>
  );
}

export default SettingsView;
