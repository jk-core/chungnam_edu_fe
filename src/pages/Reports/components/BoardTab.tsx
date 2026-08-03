import { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { FileIcon, PlusIcon } from '@/components/common/Icon';
import { FormRow, FormSection, RadioGroup, TextArea, TextField } from '@/components/common/Form';
import { Modal } from '@/components/common/Modal';
import { MSG } from '@/configs/messages';
import { daysAhead, NOW, TODAY } from '@/mocks/today';
import { Reveal } from '@/components/common/Reveal';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { formatNumber } from '@/utils/format';
import { mergePosts } from '@/stores/boardStore';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import useBoardStore from '@/stores/boardStore';
import type { BoardKind, BoardPost } from '@/interface/board';
import styles from '../Reports.module.scss';

type Filter = 'all' | BoardKind;

const KIND_LABEL: Record<BoardKind, string> = { notice: '공지사항', qna: 'Q&A' };

/** 공지사항·Q&A 게시판 (SFR-025) */
export function BoardTab() {
  const user = useAuthUser();
  const write = useBoardStore((state) => state.write);
  const comment = useBoardStore((state) => state.comment);
  const patch = useBoardStore((state) => state.patch);
  const nextId = useBoardStore((state) => state.nextId);
  const created = useBoardStore((state) => state.created);
  const patched = useBoardStore((state) => state.patched);
  const deleted = useBoardStore((state) => state.deleted);

  const [filter, setFilter] = useState<Filter>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const [draft, setDraft] = useState({
    kind: 'notice' as BoardKind,
    title: '',
    body: '',
    usePopup: 'no' as 'yes' | 'no',
    popupEnd: daysAhead(14),
  });

  const posts = useMemo(() => {
    const all = mergePosts(created, patched, deleted);

    return filter === 'all' ? all : all.filter((post) => post.kind === filter);
  }, [filter, created, patched, deleted]);

  const detail = posts.find((post) => post.id === openId) ?? null;

  const submit = () => {
    if (!draft.title.trim()) {
      setError(MSG.requiredField('제목'));

      return;
    }

    if (!draft.body.trim()) {
      setError(MSG.requiredField('내용'));

      return;
    }

    setError(undefined);
    setConfirming(true);
  };

  const commit = () => {
    const post: BoardPost = {
      id: nextId(),
      kind: draft.kind,
      title: draft.title.trim(),
      body: draft.body.trim(),
      author: user?.orgName ?? '작성자',
      at: NOW.format('YYYY-MM-DD HH:mm'),
      pinned: false,
      views: 0,
      attachments: [],
      comments: [],
      // 공지만 메인 화면 팝업으로 띄울 수 있다 (SFR-025-02/03).
      popup:
        draft.kind === 'notice' && draft.usePopup === 'yes'
          ? { start: TODAY.format('YYYY-MM-DD'), end: draft.popupEnd }
          : null,
    };

    write(post);
    toast.success(MSG.createSuccess(KIND_LABEL[draft.kind]));
    setIsWriting(false);
    setDraft({ kind: 'notice', title: '', body: '', usePopup: 'no', popupEnd: daysAhead(14) });
  };

  const addComment = () => {
    if (!detail || !commentBody.trim()) return;

    comment(detail.id, {
      id: `${detail.id}-C${detail.comments.length + 1}`,
      author: user?.orgName ?? '작성자',
      body: commentBody.trim(),
      at: NOW.format('YYYY-MM-DD HH:mm'),
    });
    setCommentBody('');
    toast.success('댓글을 남겼습니다.');
  };

  return (
    <div className={styles.tab}>
      <div className={styles.toolbar}>
        <div className={styles.toolbar__left}>
          <SegmentedControl
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: '전체' },
              { value: 'notice', label: '공지사항' },
              { value: 'qna', label: 'Q&A' },
            ]}
            label="게시판 구분"
          />
          <p className={styles.toolbar__note}>{formatNumber(posts.length)}건</p>
        </div>
        <div className={styles.toolbar__actions}>
          <Button iconLeft={<PlusIcon />} onClick={() => setIsWriting(true)}>
            글쓰기
          </Button>
        </div>
      </div>

      <Reveal>
        <Card
          eyebrow="Board"
          title="공지사항 · Q&A"
          description="고정 글이 위로 옵니다. 글을 누르면 본문과 댓글이 열립니다."
        >
          {posts.length === 0 ? (
            <EmptyState title="글이 없습니다" description="첫 글을 남겨 보세요." />
          ) : (
            <div className={styles.list}>
              {posts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  className={styles.row}
                  onClick={() => {
                    setOpenId(post.id);
                    patch(post.id, { views: post.views + 1 });
                  }}
                >
                  <span className={styles.row__body}>
                    <span className={styles.row__title}>
                      {post.pinned ? '📌 ' : ''}
                      {post.title}
                    </span>
                    <span className={styles.row__meta}>
                      {post.author} · {post.at} · 조회 {formatNumber(post.views)}
                      {post.comments.length > 0 ? ` · 댓글 ${post.comments.length}` : ''}
                      {post.attachments.length > 0 ? ` · 첨부 ${post.attachments.length}` : ''}
                    </span>
                  </span>
                  <span className={styles.row__right}>
                    {post.popup ? <Badge tone="caution">팝업</Badge> : null}
                    <Badge tone={post.kind === 'notice' ? 'brand' : 'neutral'}>{KIND_LABEL[post.kind]}</Badge>
                  </span>
                </button>
              ))}
            </div>
          )}
        </Card>
      </Reveal>

      <Modal
        isOpen={detail !== null}
        onClose={() => setOpenId(null)}
        size="lg"
        title={detail?.title ?? ''}
        description={detail ? `${detail.author} · ${detail.at} · 조회 ${formatNumber(detail.views)}` : undefined}
      >
        {detail ? (
          <div className={styles.post}>
            <p className={styles.post__body}>{detail.body}</p>

            {detail.popup ? (
              <p className={styles.post__meta}>
                <span>
                  메인 화면 팝업 기간 {detail.popup.start} ~ {detail.popup.end}
                </span>
              </p>
            ) : null}

            {detail.attachments.length > 0 ? (
              <div className={styles.post__files}>
                {detail.attachments.map((file) => (
                  <span key={file} className={styles.post__file}>
                    <FileIcon width={16} height={16} />
                    {file}
                  </span>
                ))}
              </div>
            ) : null}

            <div className={styles.comments}>
              {detail.comments.map((item) => (
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
        ) : null}
      </Modal>

      <Modal
        isOpen={isWriting}
        onClose={() => setIsWriting(false)}
        size="lg"
        title="글쓰기"
        description="공지사항은 메인 화면 팝업으로 띄울 수 있습니다."
        footer={(
          <>
            <Button variant="secondary" onClick={() => setIsWriting(false)}>
              취소
            </Button>
            <Button onClick={submit}>등록</Button>
          </>
        )}
      >
        <div className={styles.form}>
          <FormSection legend="구분">
            <RadioGroup
              legend="게시판"
              value={draft.kind}
              onChange={(value) => setDraft({ ...draft, kind: value })}
              options={[
                { value: 'notice', label: '공지사항', tone: 'brand' },
                { value: 'qna', label: 'Q&A' },
              ]}
              required
            />
          </FormSection>

          <FormSection legend="내용">
            <TextField
              label="제목"
              value={draft.title}
              onChange={(value) => setDraft({ ...draft, title: value })}
              required
              error={error?.includes('제목') ? error : undefined}
              maxLength={100}
            />
            <TextArea
              label="본문"
              value={draft.body}
              onChange={(value) => setDraft({ ...draft, body: value })}
              required
              error={error?.includes('내용') ? error : undefined}
              maxLength={2000}
            />
          </FormSection>

          {draft.kind === 'notice' ? (
            <FormSection legend="메인 팝업" hint="켜면 오늘부터 정한 날짜까지 메인 화면에 팝업으로 띄웁니다.">
              <FormRow cols={2}>
                <RadioGroup
                  legend="팝업 등록"
                  value={draft.usePopup}
                  onChange={(value) => setDraft({ ...draft, usePopup: value })}
                  options={[
                    { value: 'no', label: '띄우지 않음' },
                    { value: 'yes', label: '띄움', tone: 'brand' },
                  ]}
                />
                <TextField
                  label="팝업 종료일"
                  value={draft.popupEnd}
                  onChange={(value) => setDraft({ ...draft, popupEnd: value })}
                  ime="numeric"
                  width="md"
                  hint="YYYY-MM-DD"
                  disabled={draft.usePopup === 'no'}
                />
              </FormRow>
            </FormSection>
          ) : null}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirming}
        title={MSG.createConfirm(KIND_LABEL[draft.kind])}
        description={
          draft.kind === 'notice' && draft.usePopup === 'yes'
            ? `등록하면 ${draft.popupEnd} 까지 메인 화면에 팝업으로 뜹니다.`
            : undefined
        }
        confirmLabel="등록"
        onConfirm={commit}
        onClose={() => setConfirming(false)}
      />
    </div>
  );
}
