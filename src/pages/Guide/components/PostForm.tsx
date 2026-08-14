import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FileUpload, FormRow, FormSection, RadioGroup, TextArea, TextField } from '@/components/common/Form';
import { MSG } from '@/configs/messages';
import { Reveal } from '@/components/common/Reveal';
import { buildPath } from '@/routes/buildPath';
import { daysAhead, NOW, TODAY } from '@/mocks/today';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import useBoardStore from '@/stores/boardStore';
import type { BoardAttachment, BoardKind, BoardPost } from '@/interface/board';
import type { UploadFile } from '@/components/common/Form';
import styles from '../Guide.module.scss';
import { KIND_LABEL, WRITE_ROLE } from '../hooks/useBoardPosts';

/** 게시판 첨부로 받는 갈래 (SFR-025-06) — 이미지와 문서를 함께 받는다. */
const ATTACH_ACCEPT = [
  'image/*',
  '.pdf',
  '.hwp',
  '.hwpx',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.csv',
  '.ppt',
  '.pptx',
  '.zip',
].join(',');

/** 올린 파일을 글에 붙일 모양으로 옮긴다 — 사진은 자리까지 안고 가야 글에서 펼쳐진다 */
function toAttachment(file: UploadFile): BoardAttachment {
  return {
    name: file.name,
    kind: file.previewUrl ? 'image' : 'file',
    url: file.previewUrl,
  };
}

/**
 * 글쓰기 (SFR-025-01/06).
 *
 * 게시판마다 제 주소를 가진 화면이라 무엇을 쓰는지는 들어온 주소가 정한다. 모달로 띄우고
 * 안에서 구분을 고르게 두면, Q&A 목록에서 쓴 글이 공지로 가 목록에서 사라지는 일이 생긴다.
 */
export function PostForm({ kind }: { kind: BoardKind }) {
  const navigate = useNavigate();
  const user = useAuthUser();
  const write = useBoardStore((state) => state.write);
  const nextId = useBoardStore((state) => state.nextId);

  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [draft, setDraft] = useState({
    title: '',
    body: '',
    usePopup: 'no' as 'yes' | 'no',
    popupEnd: daysAhead(14),
    /** 첨부파일 — 이미지·문서·엑셀을 함께 받는다 (SFR-025-06) */
    files: [] as UploadFile[],
  });

  // 공지사항은 교육청이 알리는 자리다. 단추를 감춰 두었어도 주소로 들어올 수 있어 여기서도 막는다.
  if (WRITE_ROLE[kind] && user?.role !== WRITE_ROLE[kind]) {
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
      id: nextId(),
      kind,
      title: draft.title.trim(),
      body: draft.body.trim(),
      author: user?.orgName ?? '작성자',
      at: NOW.format('YYYY-MM-DD HH:mm'),
      pinned: false,
      views: 0,
      attachments: draft.files.map(toAttachment),
      comments: [],
      // 공지만 메인 화면 팝업으로 띄울 수 있다 (SFR-025-02/03).
      popup:
        kind === 'notice' && draft.usePopup === 'yes'
          ? { start: TODAY.format('YYYY-MM-DD'), end: draft.popupEnd }
          : null,
    };

    write(post);
    toast.success(MSG.createSuccess(KIND_LABEL[kind]));
    // 쓴 글을 바로 펼쳐 준다 — 목록으로 돌려보내면 방금 쓴 것을 다시 찾아 눌러야 한다.
    navigate(buildPath.boardDetail(kind, post.id), { replace: true });
  };

  return (
    <div className={styles.tab}>
      <Reveal>
        <Card
          eyebrow="Write"
          title={`${KIND_LABEL[kind]} 글쓰기`}
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
                hint="이미지·PDF·한글·엑셀 문서를 5개까지, 파일마다 10MB 까지 올릴 수 있습니다."
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
              <Button variant="secondary" onClick={() => navigate(buildPath.board(kind))}>
                취소
              </Button>
              <Button onClick={submit}>등록</Button>
            </div>
          </div>
        </Card>
      </Reveal>

      <ConfirmDialog
        isOpen={confirming}
        title={MSG.createConfirm(KIND_LABEL[kind])}
        description={
          kind === 'notice' && draft.usePopup === 'yes'
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
