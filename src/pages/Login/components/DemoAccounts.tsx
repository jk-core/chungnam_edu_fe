import { ACCOUNTS, isReviewRole, ROLE_LABEL, ROLE_SCOPE_NOTE } from '@/mocks/accounts';
import { Badge } from '@/components/common/Badge';
import { ChevronRightIcon } from '@/components/common/Icon';
import styles from '../Login.module.scss';

interface DemoAccountsProps {
  onEnter: (accountId: string) => void;
  isLocked: boolean;
}

/** 권한별로 무엇이 보이는지 눌러서 바로 확인하는 길 */
export function DemoAccounts({ onEnter, isLocked }: DemoAccountsProps) {
  return (
    <div className={styles.demo}>
      <p className={styles.demo__title}>데모 계정으로 둘러보기</p>
      <p className={styles.demo__hint}>
        권한에 따라 보이는 메뉴와 설비 범위가 달라집니다. 눌러서 바로 들어갈 수 있습니다.
      </p>

      <div className={styles.demo__list}>
        {ACCOUNTS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={styles.demo__item}
            onClick={() => onEnter(item.id)}
            disabled={isLocked}
          >
            <span className={styles.demo__body}>
              <span className={styles.demo__name}>
                {item.name} · {item.orgName}
              </span>
              <span className={styles.demo__note}>{ROLE_SCOPE_NOTE[item.role]}</span>
            </span>
            <span className={styles.demo__meta}>
              <Badge tone={isReviewRole(item.role) ? 'brand' : 'neutral'}>{ROLE_LABEL[item.role]}</Badge>
              <ChevronRightIcon />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
