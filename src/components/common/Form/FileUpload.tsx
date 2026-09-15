import { useEffect, useId, useRef, useState } from 'react';
import { CloseIcon, FileIcon, UploadIcon } from '@/components/common/Icon';
import { MSG } from '@/configs/messages';
import { Modal } from '@/components/common/Modal';
import { PHOTO_ACCEPT } from '@/configs/upload';
import { formatNumber } from '@/utils/format';
import type { FileToRemove } from '@/service/common';
import styles from './Form.module.scss';

export interface UploadFile {
  id: string;
  name: string;
  size: number;
  type: string;
  /** 새로 고른 것은 objectURL(이미지일 때만), 이미 저장된 것은 서버 주소 */
  previewUrl: string | null;
  /** 새로 고른 파일. 멀티파트에 이것을 싣는다 — 이미 저장된 것은 없다 */
  file: File | null;
  /** 이미 저장된 첨부를 가리키는 짝. 새로 고른 것은 없다 */
  saved: FileToRemove | null;
}

interface FileUploadProps {
  label: string;
  value: UploadFile[];
  onChange: (files: UploadFile[]) => void;
  accept?: string;
  maxCount?: number;
  maxSizeMb?: number;
  onError?: (message: string) => void;
  hint?: string;
}

let sequence = 0;

/**
 * 현장 사진 여러 장 첨부 (SFR-021-04~06).
 * 썸네일을 누르면 확대해 볼 수 있다 (SFR-021-10).
 */
export function FileUpload({
  label,
  value,
  onChange,
  accept = PHOTO_ACCEPT,
  maxCount = 8,
  maxSizeMb = 5,
  onError,
  hint,
}: FileUploadProps) {
  const inputId = useId();
  const [preview, setPreview] = useState<UploadFile | null>(null);

  /*
    objectURL 은 직접 놓아 주어야 메모리에 남지 않는다.

    놓아 줄 대상을 ref 에 담아 두고 **떠날 때 한 번만** 비우는 것은, 의존성을 `value` 로 두면
    배열이 바뀔 때마다 정리가 돌아 **아직 목록에 남아 있는 사진의 URL 까지 끊기기** 때문이다 —
    둘째 장을 올리면 첫 장이 깨졌다. 지우는 자리(`remove`)가 그 한 장을 따로 놓아 준다.
    서버 주소(`file === null`)는 우리가 만든 것이 아니라 건드리지 않는다.
  */
  const created = useRef<string[]>([]);

  useEffect(() => {
    created.current = value
      .filter((item) => item.file !== null && item.previewUrl !== null)
      .map((item) => item.previewUrl as string);
  }, [value]);

  useEffect(() => () => {
    created.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const accept0 = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const incoming = [...files];

    if (value.length + incoming.length > maxCount) {
      onError?.(MSG.fileTooMany(maxCount));

      return;
    }

    const tooLarge = incoming.find((file) => file.size > maxSizeMb * 1024 * 1024);

    if (tooLarge) {
      onError?.(MSG.fileTooLarge(maxSizeMb));

      return;
    }

    const added = incoming.map((file) => {
      sequence += 1;

      return {
        id: `upload-${sequence}`,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        file,
        saved: null,
      };
    });

    onChange([...value, ...added]);
  };

  const remove = (id: string) => {
    const target = value.find((item) => item.id === id);

    // 우리가 만든 objectURL 만 놓아 준다 — 서버 주소를 끊으면 되돌릴 수 없다.
    if (target?.file && target.previewUrl) URL.revokeObjectURL(target.previewUrl);

    onChange(value.filter((item) => item.id !== id));
  };

  return (
    <div className={styles.upload}>
      <label className={styles.upload__drop} htmlFor={inputId}>
        <UploadIcon width={22} height={22} />
        <span className={styles.upload__dropLabel}>{label}</span>
        <span className={styles.upload__dropHint}>
          {hint ?? `사진 ${maxCount}장까지, 한 장에 ${maxSizeMb}MB 까지 올릴 수 있습니다.`}
        </span>
        <input
          id={inputId}
          type="file"
          className={styles.upload__input}
          accept={accept}
          multiple
          onChange={(event) => {
            accept0(event.target.files);
            // 같은 파일을 다시 골라도 이벤트가 나게 값을 비운다.
            event.target.value = '';
          }}
        />
      </label>

      {value.length > 0 ? (
        <ul className={styles.upload__list}>
          {value.map((file) => (
            <li key={file.id} className={styles.thumb}>
              <button
                type="button"
                className={styles.thumb__button}
                onClick={() => setPreview(file)}
                aria-label={`${file.name} 크게 보기`}
              >
                {file.previewUrl ? (
                  <img className={styles.thumb__image} src={file.previewUrl} alt={file.name} />
                ) : (
                  <span className={styles.thumb__fallback}>
                    <FileIcon width={22} height={22} />
                  </span>
                )}
              </button>
              <span className={styles.thumb__name} title={file.name}>
                {file.name}
              </span>
              <button
                type="button"
                className={styles.thumb__remove}
                onClick={() => remove(file.id)}
                aria-label={`${file.name} 첨부 취소`}
              >
                <CloseIcon width={13} height={13} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <Modal
        isOpen={preview !== null}
        onClose={() => setPreview(null)}
        size="lg"
        title={preview?.name ?? '첨부 사진'}
        description={preview ? `${formatNumber(Math.round(preview.size / 1024))}KB` : undefined}
      >
        {preview?.previewUrl ? (
          <img className={styles.preview} src={preview.previewUrl} alt={preview.name} />
        ) : (
          <p>미리 볼 수 없는 형식입니다.</p>
        )}
      </Modal>
    </div>
  );
}
