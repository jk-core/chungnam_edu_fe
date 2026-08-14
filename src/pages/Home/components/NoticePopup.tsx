import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { FileIcon } from '@/components/common/Icon';
import { Modal } from '@/components/common/Modal';
import { mergePosts } from '@/stores/boardStore';
import useBoardStore from '@/stores/boardStore';
import { TODAY } from '@/mocks/today';
import styles from './NoticePopup.module.scss';

/**
 * 게시판에서 기간을 정해 등록한 공지를 메인 화면 팝업으로 띄운다 (SFR-025-02/03).
 * 닫으면 그 공지는 다시 뜨지 않는다.
 */
export function NoticePopup() {
  const created = useBoardStore((state) => state.created);
  const patched = useBoardStore((state) => state.patched);
  const deleted = useBoardStore((state) => state.deleted);
  const dismissed = useBoardStore((state) => state.dismissedPopups);
  const dismissPopup = useBoardStore((state) => state.dismissPopup);

  const today = TODAY.format('YYYY-MM-DD');
  const popups = mergePosts(created, patched, deleted).filter(
    (post) =>
      post.popup !== null
      && post.popup.start <= today
      && post.popup.end >= today
      && !dismissed.includes(post.id),
  );

  // 여러 건이면 한 건씩 차례로 보여 준다.
  const current = popups[0] ?? null;
  const [isOpen, setIsOpen] = useState(true);

  if (!current || !current.popup) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title={current.title}
      description={`${current.author} · 게시 기간 ${current.popup.start} ~ ${current.popup.end}`}
      footer={(
        <>
          <Button
            variant="ghost"
            onClick={() => {
              dismissPopup(current.id);
              setIsOpen(false);
            }}
          >
            다시 보지 않기
          </Button>
          <Button onClick={() => setIsOpen(false)}>닫기</Button>
        </>
      )}
    >
      <div className={styles.popup}>
        <p className={styles.popup__body}>{current.body}</p>

        {current.attachments.length > 0 ? (
          <div className={styles.popup__files}>
            {current.attachments.map((file) => (
              <span key={file.name} className={styles.popup__file}>
                <FileIcon width={16} height={16} />
                {file.name}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
