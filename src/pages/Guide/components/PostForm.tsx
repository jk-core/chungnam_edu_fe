import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FileUpload, FormRow, FormSection, RadioGroup, TextArea, TextField } from '@/components/common/Form';
import { ATTACH_ACCEPT } from '@/configs/upload';
import { MSG } from '@/configs/messages';
import { Reveal } from '@/components/common/Reveal';
import { buildPath } from '@/routes/buildPath';
import { daysAhead, NOW, TODAY } from '@/mocks/today';
import { isReviewRole } from '@/mocks/accounts';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import useBoardStore from '@/stores/boardStore';
import type { BoardAttachment, BoardKind, BoardPost } from '@/interface/board';
import type { UploadFile } from '@/components/common/Form';
import styles from '../Guide.module.scss';
import { canManagePost, KIND_LABEL, useBoardPosts, WRITE_RESTRICTED } from '../hooks/useBoardPosts';

/** 올린 파일을 글에 붙일 모양으로 옮긴다 — 사진은 자리까지 안고 가야 글에서 펼쳐진다 */
function toAttachment(file: UploadFile): BoardAttachment {
  return {
    name: file.name,
    kind: file.previewUrl ? 'image' : 'file',
    url: file.previewUrl,
  };
}

/**
 * 글쓰기·글수정 (SFR-025-01/04/06).
 *
 * 게시판마다 제 주소를 가진 화면이라 무엇을 쓰는지는 들어온 주소가 정한다. 모달로 띄우고
 * 안에서 구분을 고르게 두면, 문의 목록에서 쓴 글이 공지로 가 목록에서 사라지는 일이 생긴다.
 * 주소에 `:postId` 가 붙으면 그 글을 고치는 자리다 — 쓰는 것과 고치는 것은 채울 칸이 같다.
 */
export function PostForm({ kind }: { kind: BoardKind }) {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const user = useAuthUser();
  const write = useBoardStore((state) => state.write);
  const nextId = useBoardStore((state) => state.nextId);
  const { find } = useBoardPosts(kind);

  const target = postId ? find(postId) : null;
  const isEdit = Boolean(postId);

  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [draft, setDraft] = useState({
    title: target?.title ?? '',
    body: target?.body ?? '',
    usePopup: (target?.popup ? 'yes' : 'no') as 'yes' | 'no',
    popupEnd: target?.popup?.end ?? daysAhead(14),
    /** 첨부파일 — 이미지·문서·엑셀을 함께 받는다 (SFR-025-06) */
    files: [] as UploadFile[],
  });

  // 공지사항은 교육청이 알리는 자리다. 단추를 감춰 두었어도 주소로 들어올 수 있어 여기서도 막는다.
  if (WRITE_RESTRICTED[kind] && !isReviewRole(user?.role)) {
    return <Navigate to={buildPath.board(kind)} replace />;
  }

  // 고칠 글이 없거나 남의 글이면 목록으로 돌려보낸다 — 주소를 직접 쳐서 들어와도 같다.
  if (isEdit && (!target || !canManagePost(target, user))) {
    return <Navigate to={buildPath.board(kind)} replace />;
  }

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
      id: target?.id ?? nextId(),
      kind,
      title: draft.title.trim(),
      body: draft.body.trim(),
      author: target?.author ?? user?.orgName ?? '작성자',
      // 고칠 때는 작성일시를 그대로 둔다 — 고쳤다고 목록 맨 위로 올라오면 새 글처럼 읽힌다.
      at: target?.at ?? NOW.format('YYYY-MM-DD HH:mm'),
      pinned: target?.pinned ?? false,
      views: target?.views ?? 0,
      // 새로 올린 파일이 없으면 붙어 있던 첨부를 그대로 지킨다.
      attachments: draft.files.length > 0 ? draft.files.map(toAttachment) : target?.attachments ?? [],
      comments: target?.comments ?? [],
      // 공지만 메인 화면 팝업으로 띄울 수 있다 (SFR-025-02/03).
      popup:
        kind === 'notice' && draft.usePopup === 'yes'
          ? { start: target?.popup?.start ?? TODAY.format('YYYY-MM-DD'), end: draft.popupEnd }
          : null,
    };

    write(post);
    toast.success(isEdit ? MSG.updateSuccess(KIND_LABEL[kind]) : MSG.createSuccess(KIND_LABEL[kind]));
    // 쓴 글을 바로 펼쳐 준다 — 목록으로 돌려보내면 방금 쓴 것을 다시 찾아 눌러야 한다.
    navigate(buildPath.boardDetail(kind, post.id), { replace: true });
  };

  return (
    <div className={styles.tab}>
      <Reveal>
        <Card
          title={`${KIND_LABEL[kind]} ${isEdit ? '글수정' : '글쓰기'}`}
          description={
            kind === 'notice'
              ? '올린 글은 공지사항 목록에 실립니다. 메인 화면 팝업으로도 띄울 수 있습니다.'
              : '궁금한 점을 남기면 담당자가 댓글로 답합니다.'
          }
        >
          <div className={styles.form}>
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

            {/* 이미지·엑셀 등 첨부파일 (SFR-025-06) */}
            <FormSection legend="첨부파일" hint="올린 사진은 첨부 목록이 아니라 글 안에서 바로 보입니다.">
              <FileUpload
                label="파일 올리기"
                value={draft.files}
                onChange={(files) => setDraft({ ...draft, files })}
                accept={ATTACH_ACCEPT}
                maxCount={5}
                maxSizeMb={10}
                hint={isEdit && (target?.attachments.length ?? 0) > 0
                  ? `지금 붙어 있는 파일 ${target?.attachments.length}개는 그대로 둡니다. 새로 올리면 통째로 바뀝니다.`
                  : '이미지·PDF·한글·엑셀 문서를 5개까지, 파일마다 10MB 까지 올릴 수 있습니다.'}
                onError={(message) => toast.error(message)}
              />
            </FormSection>

            {kind === 'notice' ? (
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

            <div className={styles.formActions}>
              <Button
                variant="secondary"
                onClick={() => navigate(isEdit && target ? buildPath.boardDetail(kind, target.id) : buildPath.board(kind))}
              >
                취소
              </Button>
              <Button onClick={submit}>{isEdit ? '수정' : '등록'}</Button>
            </div>
          </div>
        </Card>
      </Reveal>

      <ConfirmDialog
        isOpen={confirming}
        title={isEdit ? MSG.updateConfirm(KIND_LABEL[kind]) : MSG.createConfirm(KIND_LABEL[kind])}
        description={
          kind === 'notice' && draft.usePopup === 'yes'
            ? `${isEdit ? '수정' : '등록'}하면 ${draft.popupEnd} 까지 메인 화면에 팝업으로 뜹니다.`
            : undefined
        }
        confirmLabel={isEdit ? '수정' : '등록'}
        onConfirm={commit}
        onClose={() => setConfirming(false)}
      />
    </div>
  );
}
