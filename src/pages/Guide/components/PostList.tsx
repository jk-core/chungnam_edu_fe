import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { PlusIcon } from '@/components/common/Icon';
import { Reveal } from '@/components/common/Reveal';
import { buildPath } from '@/routes/buildPath';
import { formatNumber } from '@/utils/format';
import { isReviewRole } from '@/mocks/accounts';
import { useAuthUser } from '@/stores/authStore';
import type { BoardKind } from '@/interface/board';
import styles from '../Guide.module.scss';
import { KIND_LABEL, useBoardPosts, WRITE_RESTRICTED } from '../hooks/useBoardPosts';

const DESCRIPTION: Record<BoardKind, string> = {
  notice: '교육청이 알리는 글입니다. 고정 글이 위로 오고, 제목을 누르면 본문으로 넘어갑니다.',
  inquiry: '궁금한 점을 남기면 담당자가 댓글로 답합니다. 제목을 누르면 본문과 댓글로 넘어갑니다.',
};

/**
 * 게시판 목록 (SFR-025).
 *
 * 공지사항과 문의하기는 저마다 제 주소를 가진 화면이다. 한 목록에 섞어 두면 무엇을 보고 있는지가
 * 필터에 달려 있어, 주소를 주고받아도 같은 화면이 열리지 않는다.
 */
export function PostList({ kind }: { kind: BoardKind }) {
  const navigate = useNavigate();
  const user = useAuthUser();
  const { posts } = useBoardPosts(kind);
  const canWrite = !WRITE_RESTRICTED[kind] || isReviewRole(user?.role);

  return (
    <div className={styles.tab}>
      <div className={styles.toolbar}>
        <div className={styles.toolbar__left}>
          <p className={styles.toolbar__count}>총 {formatNumber(posts.length)}건</p>
          {/* 왜 쓸 수 없는지는 단추를 감추기보다 한 줄로 말해 주는 편이 낫다 */}
          {canWrite ? null : <p className={styles.toolbar__note}>공지사항은 교육청 관리자만 쓸 수 있습니다.</p>}
        </div>

        {canWrite ? (
          <div className={styles.toolbar__actions}>
            <Button iconLeft={<PlusIcon />} onClick={() => navigate(buildPath.boardWrite(kind))}>
              글쓰기
            </Button>
          </div>
        ) : null}
      </div>

      <Reveal>
        <Card title={KIND_LABEL[kind]} description={DESCRIPTION[kind]}>
          {posts.length === 0 ? (
            <EmptyState title="글이 없습니다" description="아직 올라온 글이 없습니다." />
          ) : (
            <div className={styles.list}>
              {posts.map((post) => {
                const images = post.attachments.filter((file) => file.kind === 'image').length;

                return (
                  <button
                    key={post.id}
                    type="button"
                    className={styles.row}
                    onClick={() => navigate(buildPath.boardDetail(kind, post.id))}
                  >
                    <span className={styles.row__body}>
                      <span className={styles.row__title}>
                        {post.pinned ? '📌 ' : ''}
                        {post.title}
                      </span>
                      <span className={styles.row__meta}>
                        {post.author} · {post.at} · 조회 {formatNumber(post.views)}
                        {post.comments.length > 0 ? ` · 댓글 ${post.comments.length}` : ''}
                        {images > 0 ? ` · 사진 ${images}` : ''}
                        {post.attachments.length - images > 0 ? ` · 첨부 ${post.attachments.length - images}` : ''}
                      </span>
                    </span>
                    <span className={styles.row__right}>
                      {post.popup ? <Badge tone="caution">팝업</Badge> : null}
                      {post.pinned ? <Badge tone="brand">고정</Badge> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      </Reveal>
    </div>
  );
}
