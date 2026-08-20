import { Card } from '@/components/common/Card';
import { Reveal } from '@/components/common/Reveal';
import useAssetStore from '@/stores/assetStore';
import styles from '../../Admin.module.scss';

/**
 * 지금 걸려 있는 값 (SFR-026).
 *
 * 위 입력칸은 아직 저장하지 않은 초안을 보여 주므로, 실제로 걸린 값은 따로 적어 둔다 —
 * 고치다 만 화면에서 「지금은 어떻게 되어 있더라」 를 물을 곳이 있어야 한다.
 */
export function PolicyCurrent() {
  const policy = useAssetStore((state) => state.policy);

  return (
    <Reveal delay={0.06}>
      <Card title="현재 적용값" variant="outline">
        <dl className={styles.infoGrid}>
          <div>
            <dt>비밀번호 재설정 주기</dt>
            <dd>{policy.passwordResetDays}일</dd>
          </div>
          <div>
            <dt>로그인 실패 허용</dt>
            <dd>{policy.maxFailCount}회</dd>
          </div>
          <div>
            <dt>유지시간</dt>
            <dd>관리자 {policy.adminSessionMinutes}분 · 일반 {policy.userSessionMinutes}분</dd>
          </div>
        </dl>
      </Card>
    </Reveal>
  );
}
