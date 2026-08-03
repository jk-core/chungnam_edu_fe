import { AnimatePresence, motion } from 'motion/react';
import { MoonIcon, SunIcon } from '@/components/common/Icon';
import { useTheme, useToggleTheme } from '@/stores/themeStore';
import styles from './ThemeToggle.module.scss';

export function ThemeToggle() {
  const theme = useTheme();
  const toggleTheme = useToggleTheme();

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label={theme === 'light' ? '어두운 화면으로 전환' : '밝은 화면으로 전환'}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          className={styles.toggle__icon}
          initial={{ opacity: 0, rotate: -45, scale: 0.7 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 45, scale: 0.7 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
