import { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { OPERATION_LABEL, OPERATION_ORDER, OPERATION_RANK, OPERATION_TONE } from '@/mocks/status';
import { CHUNGNAM_REGIONS } from '@/configs/regions';
import { getInvertersOf } from '@/mocks/equipment';
import { SCHOOL_LEVELS, SCHOOLS } from '@/mocks/schools';
import { Select } from '@/components/common/Select';
import { TextField } from '@/components/common/Form';
import { formatNumber } from '@/utils/format';
import type { School } from '@/interface/energy';
import styles from './PlantSearchModal.module.scss';

export const ALL = 'all';

/** 한 번에 펼 검색 결과 — 300개를 다 깔면 읽히지 않는다. */
const MAX_RESULTS = 40;

export interface PlantFilters {
  keyword: string;
  region: string;
  level: string;
  status: string;
}

export const EMPTY_FILTERS: PlantFilters = {
  keyword: '',
  region: ALL,
  level: ALL,
  status: ALL,
};

interface PlantSearchModalProps {
  isOpen: boolean;
  filters: PlantFilters;
  onClose: () => void;
  onApply: (filters: PlantFilters) => void;
  /**
   * 결과에서 발전소를 고르면 그 발전소로 넘어간다.
   * 상황판처럼 넘어갈 화면이 없는 자리에서는 넘기지 않는다 — 조건만 걸고 닫는다.
   */
  onSelect?: (plant: School) => void;
}

/**
 * 발전소 검색 (SFR-004-11/12).
 * 상단에 필터 줄을 길게 늘어놓는 대신 모달 하나로 모았다 —
 * 관제 화면은 조건을 바꾸는 일보다 지금 상태를 보는 일이 훨씬 잦다.
 */
export function PlantSearchModal({ isOpen, filters, onClose, onApply, onSelect }: PlantSearchModalProps) {
  const [draft, setDraft] = useState<PlantFilters>(filters);

  const results = useMemo(() => matchPlants(draft), [draft]);

  const apply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="발전소 검색"
      description="학교명·지역·기관별·설비 상태로 좁혀 봅니다."
      footer={(
        <>
          <Button variant="secondary" onClick={() => setDraft(EMPTY_FILTERS)}>
            조건 초기화
          </Button>
          <Button onClick={apply}>{formatNumber(results.length)}개소 보기</Button>
        </>
      )}
    >
      <div className={styles.search}>
        <TextField
          label="학교명 · 설비명"
          value={draft.keyword}
          onChange={(value) => setDraft({ ...draft, keyword: value })}
          placeholder="학교명·주소로 검색"
        />

        <div className={styles.search__row}>
          <Select
            label="지역"
            value={draft.region}
            onChange={(value) => setDraft({ ...draft, region: value })}
            options={[{ value: ALL, label: '전체 지역' }, ...CHUNGNAM_REGIONS.map((item) => ({ value: item.code, label: item.name }))]}
          />
          <Select
            label="기관별"
            value={draft.level}
            onChange={(value) => setDraft({ ...draft, level: value })}
            options={[{ value: ALL, label: '전체 학교급' }, ...SCHOOL_LEVELS.map((item) => ({ value: item, label: item }))]}
          />
        </div>

        <div className={styles.search__row}>
          <Select
            label="설비 상태"
            value={draft.status}
            onChange={(value) => setDraft({ ...draft, status: value })}
            options={[{ value: ALL, label: '전체 상태' }, ...OPERATION_ORDER.map((item) => ({ value: item, label: OPERATION_LABEL[item] }))]}
          />
        </div>

        <p className={styles.search__count}>
          조건에 걸린 발전소 {formatNumber(results.length)}개소
          {results.length > MAX_RESULTS ? ` · 아래에는 ${MAX_RESULTS}개소만 폅니다` : ''}
        </p>

        <ul className={styles.search__list}>
          {results.slice(0, MAX_RESULTS).map((plant) => (
            <li key={plant.id}>
              <button
                type="button"
                className={styles.search__item}
                onClick={() => {
                  onSelect?.(plant);
                  onClose();
                }}
              >
                <span className={styles.search__name}>{plant.name}</span>
                <span className={styles.search__meta}>
                  {plant.regionName} · {formatNumber(plant.capacityKw, 1)}kW
                </span>
                <Badge tone={OPERATION_TONE[plant.status]} withDot>
                  {OPERATION_LABEL[plant.status]}
                </Badge>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}

/** 조건에 걸리는 발전소. 이상 설비를 앞세운다 (SFR-004-13). */
export function matchPlants(filters: PlantFilters): School[] {
  const query = filters.keyword.trim().toLowerCase();

  return SCHOOLS
    .filter((school) => {
      if (filters.region !== ALL && school.regionCode !== filters.region) return false;
      if (filters.level !== ALL && school.level !== filters.level) return false;
      if (filters.status !== ALL && school.status !== filters.status) return false;
      if (!query) return true;

      // 설비명으로도 찾는다 — 인버터 이름만 아는 상태로 오는 경우가 있다 (SFR-004-11).
      const fields = [
        school.name,
        school.regionName,
        school.address,
        OPERATION_LABEL[school.status],
        ...getInvertersOf(school.id).map((inverter) => inverter.name),
      ];

      return fields.some((field) => field.toLowerCase().includes(query));
    })
    .sort((a, b) => OPERATION_RANK[a.status] - OPERATION_RANK[b.status] || b.capacityKw - a.capacityKw);
}
