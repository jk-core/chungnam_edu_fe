import { motion } from 'motion/react';
import { cn } from '@/utils/cn';
import styles from './Switch.module.scss';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** 스크린리더에 읽힐 항목 이름 */
  label: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, disabled = false }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={cn(styles.switch, { [styles['switch--on']]: checked })}
      onClick={() => onChange(!checked)}
    >
      <motion.span
        className={styles.switch__knob}
        layout
        transition={{ type: 'spring', stiffness: 520, damping: 34 }}
      />
    </button>
  );
}
