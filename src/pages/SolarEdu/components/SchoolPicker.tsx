import { useNavigate, useSearchParams } from 'react-router-dom';
import { PATH } from '@/routes/routes';
import { SCHOOLS } from '@/mocks/schools';
import type { EduVariant } from '@/components/solar-edu/variants/EduBoard';
import styles from '../SolarEdu.module.scss';

interface SchoolPickerProps {
  /** 지금 보고 있는 학교. 도 전체면 null */
  plantId: string | null;
  /** 보고 있는 시안 — 학교를 옮겨도 같은 시안에 머문다 */
  variant: EduVariant;
}

/** 어느 학교를 띄울지 고른다. 보고 있던 시안과 고정해 둔 눈높이는 학교를 옮겨도 따라간다. */
export function SchoolPicker({ plantId, variant }: SchoolPickerProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const levelParam = searchParams.get('level');

  return (
    <select
      className={styles.schoolPicker}
      value={plantId ?? ''}
      aria-label="학교 고르기"
      onChange={(event) => {
        const root = `${PATH.SOLAR_EDU}/${variant}`;
        const base = event.target.value ? `${root}/${event.target.value}` : root;

        navigate(levelParam ? `${base}?level=${levelParam}` : base);
      }}
    >
      <option value="">충청남도 전체</option>
      {SCHOOLS.map((school) => (
        <option key={school.id} value={school.id}>
          {school.name}
        </option>
      ))}
    </select>
  );
}
