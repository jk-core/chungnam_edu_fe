import { FileUpload, FormSection } from '@/components/common/Form';
import { Select } from '@/components/common/Select';
import { toast } from '@/stores/toastStore';
import type { UploadFile } from '@/components/common/Form';
import styles from '../../FieldReport.module.scss';
import type { TemplateQuestion } from './question';

interface PhotoFieldsProps {
  photos: UploadFile[];
  onChange: (photos: UploadFile[]) => void;
  /** 사진 id → 점검 항목 id. 비어 있으면 보고서 전체에 붙은 사진이다 */
  links: Record<string, string>;
  onLink: (photoId: string, itemId: string) => void;
  questions: TemplateQuestion[];
}

/** 현장 사진과 사진마다 붙는 점검 항목 (SFR-021-06) */
export function PhotoFields({ photos, onChange, links, onLink, questions }: PhotoFieldsProps) {
  return (
    <FormSection legend="현장 사진" hint="미흡 항목이 있으면 사진을 함께 남겨 주세요.">
      <FileUpload
        label="사진 올리기"
        value={photos}
        onChange={onChange}
        onError={(message) => toast.error(message)}
      />

      {/*
        사진마다 어느 점검 항목을 찍은 것인지 붙여 둔다 (SFR-021-06).
        나중에 보고서를 다시 열었을 때 "이 사진이 무엇에 대한 자료인지" 를 답한다.
      */}
      {photos.length > 0 ? (
        <ul className={styles.photoLinks}>
          {photos.map((file) => (
            <li key={file.id} className={styles.photoLinks__row}>
              <span className={styles.photoLinks__name}>{file.name}</span>
              <Select
                label={`${file.name} 연계 항목`}
                hideLabel
                value={links[file.id] ?? ''}
                options={[
                  { value: '', label: '보고서 전체' },
                  ...questions.map((question) => ({ value: question.id, label: question.label })),
                ]}
                onChange={(value) => onLink(file.id, value)}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </FormSection>
  );
}
