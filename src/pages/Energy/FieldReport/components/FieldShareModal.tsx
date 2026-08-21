import { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { NOW } from '@/mocks/today';
import { ROLE_LABEL, SEED_USERS } from '@/mocks/accounts';
import { TextField } from '@/components/common/Form';
import { cn } from '@/utils/cn';
import type { FieldReport } from '@/interface/fieldReport';
import type { ManagedUser } from '@/interface/account';
import styles from '../FieldReport.module.scss';

/** 공유 링크가 살아 있는 기간 — 점검 결과는 오래 떠돌 이유가 없다. */
const EXPIRE_DAYS = 7;

interface FieldShareModalProps {
  report: FieldReport | null;
  onClose: () => void;
  /** 공유 사실을 보고서 이력에 남긴다 */
  onShare: (report: FieldReport, recipients: ManagedUser[]) => void;
}

/**
 * 관계자 공유 (SFR-021-18).
 * 받는 사람은 그 발전소를 볼 권한이 있는 계정으로만 추린다 — 권한 없는 사람은 목록에 뜨지 않는다.
 */
export function FieldShareModal({ report, onClose, onShare }: FieldShareModalProps) {
  const [picked, setPicked] = useState<string[]>([]);

  const candidates = useMemo(() => (report ? recipientsFor(report.schoolId) : []), [report]);
  const chosen = candidates.filter((user) => picked.includes(user.id));
  const link = report ? `${window.location.origin}/reports/field?report=${report.id}` : '';

  const close = () => {
    setPicked([]);
    onClose();
  };

  const submit = () => {
    if (!report || chosen.length === 0) return;

    onShare(report, chosen);
    close();
  };

  return (
    <Modal
      isOpen={report !== null}
      onClose={close}
      size="lg"
      title="관계자에게 공유"
      description={report ? `${report.schoolName} · ${report.date} 점검 보고서` : undefined}
      footer={(
        <>
          <Button variant="secondary" onClick={close}>
            취소
          </Button>
          <Button onClick={submit} disabled={chosen.length === 0}>
            {chosen.length > 0 ? `${chosen.length}명에게 공유` : '공유'}
          </Button>
        </>
      )}
    >
      {report ? (
        <div className={styles.share}>
          <p className={styles.share__note}>
            이 발전소를 볼 권한이 있는 계정만 나옵니다. 링크는 {EXPIRE_DAYS}일 뒤인{' '}
            {NOW.add(EXPIRE_DAYS, 'day').format('YYYY-MM-DD')}에 닫힙니다.
          </p>

          <div className={styles.share__list}>
            {candidates.map((user) => {
              const on = picked.includes(user.id);

              return (
                <button
                  key={user.id}
                  type="button"
                  className={cn(styles.share__chip, { [styles['share__chip--on']]: on })}
                  aria-pressed={on}
                  onClick={() => setPicked((prev) => (on ? prev.filter((id) => id !== user.id) : [...prev, user.id]))}
                >
                  <span className={styles.share__name}>{user.name}</span>
                  <Badge tone={user.role === 'institution' ? 'neutral' : 'brand'}>{ROLE_LABEL[user.role]}</Badge>
                  <span className={styles.share__org}>{user.loginId}</span>
                </button>
              );
            })}
          </div>

          <TextField label="공유 링크 (읽기 전용)" value={link} onChange={() => undefined} readOnly ime="latin" />
        </div>
      ) : null}
    </Modal>
  );
}

/** 교육청 계정은 전체를, 학교 계정은 담당 발전소만 볼 수 있다 (SFR-023-02/03). */
function recipientsFor(schoolId: string): ManagedUser[] {
  return SEED_USERS.filter((user) => (
    user.role === 'institution' ? user.plantIds.includes(schoolId) : true
  ));
}
