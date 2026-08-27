import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { BoardIcon, ChevronLeftIcon, ChevronRightIcon, FileIcon } from '@/components/common/Icon';
import { MSG } from '@/configs/messages';
import { Reveal } from '@/components/common/Reveal';
import { TextField } from '@/components/common/Form';
import { buildPath } from '@/routes/buildPath';
import { formatNumber } from '@/utils/format';
import { NOW } from '@/mocks/today';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import useBoardStore from '@/stores/boardStore';
import type { BoardKind, BoardPost } from '@/interface/board';
import styles from '../Guide.module.scss';
import { canManagePost, KIND_LABEL, useBoardPosts } from '../hooks/useBoardPosts';

/**
 * 글 하나 (SFR-025-04/05/06).
 *
 * 모달이 아니라 제 주소를 가진 화면이다. 주소를 주고받으면 같은 글이 열리고, 뒤로 가기가
 * 목록으로 되짚는다. 모달로 띄우면 그 글을 가리키는 주소가 아예 없다.
 */
export function PostView({ kind }: { kind: BoardKind }) {
  const { postId = '' } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const user = useAuthUser();
  const patch = useBoardStore((state) => state.patch);
  const comment = useBoardStore((state) => state.comment);
  const remove = useBoardStore((state) => state.remove);
  const { find, neighborsOf } = useBoardPosts(kind);
  const [commentBody, setCommentBody] = useState('');
  const [removing, setRemoving] = useState(false);

  const post = find(postId);
  const { previous, next } = neighborsOf(postId);

  /*
    조회수는 글마다 한 번만 올린다.
    목록에서 세면 눌러 놓고 뒤로 간 것까지 세고, 매 렌더에 세면 댓글 한 줄에도 늘어난다.
  */
  const counted = useRef<string | null>(null);

  useEffect(() => {
    if (!post || counted.current === post.id) return;

    counted.current = post.id;
    patch(post.id, { views: post.views + 1 });
  }, [post, patch]);

  // 지워졌거나 없는 글이면 목록으로 돌려보낸다.
  if (!post) return <Navigate to={buildPath.board(kind)} replace />;

  const images = post.attachments.filter((file) => file.kind === 'image' && file.url);
  const files = post.attachments.filter((file) => file.kind !== 'image' || !file.url);
  const canManage = canManagePost(post, user);

  const addComment = () => {
    if (!commentBody.trim()) return;

    comment(post.id, {
      id: `${post.id}-C${post.comments.length + 1}`,
      author: user?.orgName ?? '작성자',
      body: commentBody.trim(),
      at: NOW.format('YYYY-MM-DD HH:mm'),
    });
    setCommentBody('');
    toast.success('댓글을 남겼습니다.');
  };

  return (
    <div className={styles.tab}>
      <Reveal>
        <Card
          eyebrow={KIND_LABEL[kind]}
          title={post.title}
          description={`${post.author} · ${post.at} · 조회 ${formatNumber(post.views)}`}
          action={(
            <div className={styles.postActions}>
              {post.popup ? <Badge tone="caution">메인 팝업</Badge> : null}
              {/* 남의 글에는 단추 자체를 두지 않는다 — 눌러 보고 막히는 것보다 낫다 (SFR-025-01/04) */}
              {canManage ? (
                <>
                  <Button variant="secondary" size="sm" onClick={() => navigate(buildPath.boardEdit(kind, post.id))}>
                    수정
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setRemoving(true)}>
                    삭제
                  </Button>
                </>
              ) : null}
            </div>
          )}
        >
          <div className={styles.post}>
            <p className={styles.post__body}>{post.body}</p>

            {/*
              사진은 글 안에서 바로 보인다.
              첨부 목록에만 두면 무슨 사진인지 알려면 하나씩 내려받아 열어 봐야 한다.
            */}
            {images.length > 0 ? (
              <ul className={styles.gallery}>
                {images.map((file) => (
                  <li key={file.name} className={styles.gallery__item}>
                    <img className={styles.gallery__image} src={file.url ?? ''} alt={file.name} />
                    <p className={styles.gallery__caption}>{file.name}</p>
                  </li>
                ))}
              </ul>
            ) : null}

            {post.popup ? (
              <p className={styles.post__meta}>
                <span>
                  메인 화면 팝업 기간 {post.popup.start} ~ {post.popup.end}
                </span>
              </p>
            ) : null}

            {/* 사진이 아닌 것만 남는다 — 문서는 내려받는 수밖에 없다 */}
            {files.length > 0 ? (
              <div className={styles.post__files}>
                {files.map((file) => (
                  <span key={file.name} className={styles.post__file}>
                    <FileIcon width={16} height={16} />
                    {file.name}
                  </span>
                ))}
              </div>
            ) : null}

            <div className={styles.comments}>
              {post.comments.map((item) => (
                <div key={item.id} className={styles.comment}>
                  <p className={styles.comment__head}>
                    <span className={styles.comment__author}>{item.author}</span>
                    <span>{item.at}</span>
                  </p>
                  <p className={styles.comment__body}>{item.body}</p>
                </div>
              ))}

              <div className={styles.commentForm}>
                <span className={styles.commentForm__field}>
                  <TextField
                    label="댓글"
                    value={commentBody}
                    onChange={setCommentBody}
                    placeholder="답변이나 의견을 남겨 주세요."
                    maxLength={300}
                  />
                </span>
                <Button onClick={addComment} disabled={!commentBody.trim()}>
                  등록
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </Reveal>

      {/*
        앞뒤로 오가는 자리.
        목록으로 돌아갔다 다시 들어오지 않아도 옆 글로 건너갈 수 있고, 제목을 함께 보여 주어
        건너가기 전에 무엇인지 알 수 있다. 끝에 닿으면 흐린 안내 문구가 그 자리를 지킨다.
      */}
      <nav className={styles.pager} aria-label="글 넘기기">
        <PagerLink kind={kind} post={previous} direction="previous" />

        <Button variant="secondary" iconLeft={<BoardIcon />} onClick={() => navigate(buildPath.board(kind))}>
          목록
        </Button>

        <PagerLink kind={kind} post={next} direction="next" />
      </nav>

      <ConfirmDialog
        isOpen={removing}
        tone="danger"
        title={MSG.deleteConfirm(KIND_LABEL[kind])}
        description={post.comments.length > 0 ? `달린 댓글 ${post.comments.length}개도 함께 사라집니다.` : undefined}
        confirmLabel="삭제"
        onConfirm={() => {
          remove(post.id);
          toast.success(MSG.deleteSuccess(KIND_LABEL[kind]));
          navigate(buildPath.board(kind), { replace: true });
        }}
        onClose={() => setRemoving(false)}
      />
    </div>
  );
}

interface PagerLinkProps {
  kind: BoardKind;
  post: BoardPost | null;
  direction: 'previous' | 'next';
}

const DIRECTION_LABEL = { previous: '이전 글', next: '다음 글' } as const;

function PagerLink({ kind, post, direction }: PagerLinkProps) {
  const navigate = useNavigate();
  const isNext = direction === 'next';
  const Arrow = isNext ? ChevronRightIcon : ChevronLeftIcon;

  if (!post) {
    return (
      <p className={styles.pager__end} data-side={direction}>
        {isNext ? '마지막 글입니다' : '첫 글입니다'}
      </p>
    );
  }

  return (
    <button
      type="button"
      className={styles.pager__link}
      data-side={direction}
      onClick={() => navigate(buildPath.boardDetail(kind, post.id))}
    >
      <Arrow className={styles.pager__arrow} aria-hidden />
      <span className={styles.pager__text}>
        <span className={styles.pager__label}>{DIRECTION_LABEL[direction]}</span>
        <span className={styles.pager__title}>{post.title}</span>
      </span>
    </button>
  );
}
