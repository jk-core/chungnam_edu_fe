import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDownIcon,
  HelpCircleIcon,
  LogoutIcon,
  MonitorIcon,
  MoonIcon,
  ShieldIcon,
  SunIcon,
  UserIcon,
} from '@/components/common/Icon';
import { Badge } from '@/components/common/Badge';
import { buildPath } from '@/routes/buildPath';
import { PATH } from '@/routes/routes';
import { isAdminRole, isReviewRole, ROLE_LABEL, ROLE_SCOPE_NOTE } from '@/mocks/accounts';
import { cn } from '@/utils/cn';
import useAuthStore, { useAuthUser, useLogout } from '@/stores/authStore';
import { useSelectedPlantId } from '@/stores/plantStore';
import { useSetTheme, useTheme } from '@/stores/themeStore';
import styles from './AccountMenu.module.scss';

/** 남은 로그인 유지시간(분). 0 이하면 표시하지 않는다. */
function remainingMinutes(expiresAt: number | null): number {
  if (expiresAt === null) return 0;

  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 60000));
}

/** 헤더 우측 계정 메뉴. 로그아웃과 권한 안내를 담는다. */
interface AccountMenuProps {
  /** 도움말 패널을 여는 손잡이. 헤더가 넘겨 준다. */
  onOpenHelp?: () => void;
}

export function AccountMenu({ onOpenHelp }: AccountMenuProps) {
  const user = useAuthUser();
  const logout = useLogout();
  const selectedPlantId = useSelectedPlantId();
  const theme = useTheme();
  const setTheme = useSetTheme();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // 바깥을 누르거나 ESC 를 치면 접는다.
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!user) return null;

  const minutesLeft = remainingMinutes(useAuthStore.getState().expiresAt);

  return (
    <div className={styles.account} ref={rootRef}>
      <button
        type="button"
        className={styles.account__trigger}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className={styles.account__initial} aria-hidden="true">
          {user.name.slice(0, 1)}
        </span>
        <span className={styles.account__name}>{user.name}</span>
        <ChevronDownIcon
          className={cn(styles.account__caret, { [styles['account__caret--open']]: isOpen })}
          width={16}
          height={16}
        />
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="account-panel"
            className={styles.panel}
            role="menu"
            aria-label="계정 메뉴"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
          >
            <div className={styles.panel__head}>
              <p className={styles.panel__name}>
                {user.name} <Badge tone={isReviewRole(user.role) ? 'brand' : 'neutral'}>{ROLE_LABEL[user.role]}</Badge>
              </p>
              <p className={styles.panel__org}>
                {user.orgName} · {user.department}
              </p>
              <p className={styles.panel__note}>{ROLE_SCOPE_NOTE[user.role]}</p>
            </div>

            <div className={styles.panel__list}>
              <Link
                to={PATH.CONTROL}
                role="menuitem"
                className={styles.panel__item}
                onClick={() => setIsOpen(false)}
              >
                <MonitorIcon width={18} height={18} />
                통합관제 화면
                <span className={styles.panel__itemNote}>전체화면</span>
              </Link>

              {/* 교육용 화면은 조회 중인 학교로 바로 연다 — 고르지 않았으면 도 전체다 */}
              <Link
                to={selectedPlantId ? buildPath.solarEdu(selectedPlantId) : PATH.SOLAR_EDU}
                role="menuitem"
                className={styles.panel__item}
                onClick={() => setIsOpen(false)}
              >
                <SunIcon width={18} height={18} />
                교육용 대시보드
                <span className={styles.panel__itemNote}>전체화면</span>
              </Link>

              <Link to={PATH.MY} role="menuitem" className={styles.panel__item} onClick={() => setIsOpen(false)}>
                <UserIcon width={18} height={18} />
                마이페이지
              </Link>

              {/* 헤더 자리는 알림이 가져갔다 — 도움말은 여기서 연다 (SIF-005). */}
              {onOpenHelp ? (
                <button
                  type="button"
                  role="menuitem"
                  className={styles.panel__item}
                  onClick={() => {
                    setIsOpen(false);
                    onOpenHelp();
                  }}
                >
                  <HelpCircleIcon width={18} height={18} />
                  이 화면 도움말
                </button>
              ) : null}

              {isAdminRole(user.role) ? (
                <Link
                  to={PATH.ADMIN_PLANTS}
                  role="menuitem"
                  className={styles.panel__item}
                  onClick={() => setIsOpen(false)}
                >
                  <ShieldIcon width={18} height={18} />
                  관리자 콘솔
                  <span className={styles.panel__itemNote}>내부망</span>
                </Link>
              ) : null}

              {/*
                화면 모드.
                머리띠에 아이콘 하나로 달아 두면 지금이 밝은 쪽인지 어두운 쪽인지 눌러 봐야 알지만,
                두 갈래를 나란히 두면 어느 쪽에 서 있는지가 눌린 단추로 바로 읽힌다.
              */}
              <div className={styles.panel__setting} role="group" aria-label="화면 모드">
                <span className={styles.panel__settingLabel}>화면 모드</span>
                <span className={styles.panel__choice}>
                  <button
                    type="button"
                    className={cn(styles.panel__choiceItem, {
                      [styles['panel__choiceItem--on']]: theme === 'light',
                    })}
                    aria-pressed={theme === 'light'}
                    aria-label="밝은 화면"
                    onClick={() => setTheme('light')}
                  >
                    <SunIcon width={16} height={16} />
                  </button>
                  <button
                    type="button"
                    className={cn(styles.panel__choiceItem, {
                      [styles['panel__choiceItem--on']]: theme === 'dark',
                    })}
                    aria-pressed={theme === 'dark'}
                    aria-label="어두운 화면"
                    onClick={() => setTheme('dark')}
                  >
                    <MoonIcon width={16} height={16} />
                  </button>
                </span>
              </div>

              <button
                type="button"
                role="menuitem"
                className={cn(styles.panel__item, styles['panel__item--danger'])}
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
              >
                <LogoutIcon width={18} height={18} />
                로그아웃
                {minutesLeft > 0 ? <span className={styles.panel__itemNote}>{minutesLeft}분 남음</span> : null}
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
