import { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { OPERATION_LABEL, OPERATION_TONE, RTU_LABEL, RTU_TONE } from '@/mocks/status';
import { CheckIcon, SchoolIcon } from '@/components/common/Icon';
import { EmptyState } from '@/components/common/EmptyState';
import { Modal } from '@/components/common/Modal';
import { REGIONS } from '@/mocks/regions';
import { ROOT_ID } from '@/mocks/tree';
import { SCHOOLS } from '@/mocks/schools';
import { Select } from '@/components/common/Select';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import { useAllowedPlantIds } from '@/hooks/useScopeClamp';
import { useSelectedNode, useSelectNode } from '@/stores/plantStore';
import styles from './PlantPicker.module.scss';

const REGION_OPTIONS = [
  { value: 'all', label: '전체 시·군' },
  ...REGIONS.map((region) => ({ value: region.code, label: region.name })),
];

interface PlantPickerProps {
  /** block 은 좌측 컬럼에 들어가는 전체 폭 카드형 트리거다. */
  variant?: 'inline' | 'block';
}

/**
 * 발전소 선택기. 128개를 드롭다운에 담기 어려워 검색·필터가 있는 모달로 펼친다.
 * 발전소 아래 인버터·접속반·스트링·채널은 좌측 설비 구조 트리에서 고른다.
 */
export function PlantPicker({ variant = 'inline' }: PlantPickerProps) {
  const node = useSelectedNode();
  const selectNode = useSelectNode();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [regionCode, setRegionCode] = useState('all');

  // 교육기관 계정은 담당 발전소만 목록에 나온다 (SFR-023-03).
  const allowedIds = useAllowedPlantIds();
  const isScoped = allowedIds.length > 0;

  const results = useMemo(() => {
    const keyword = query.trim();

    return SCHOOLS.filter((school) => {
      if (isScoped && !allowedIds.includes(school.id)) return false;
      if (regionCode !== 'all' && school.regionCode !== regionCode) return false;
      if (!keyword) return true;

      return school.name.includes(keyword) || school.address.includes(keyword);
    });
  }, [query, regionCode, isScoped, allowedIds]);

  const isRoot = node.kind === 'root';
  const currentPlantId = node.plantId;

  const choose = (id: string) => {
    selectNode(id);
    setIsOpen(false);
  };

  return (
    <>
      <button type="button" className={cn(styles.trigger, styles[`trigger--${variant}`])} onClick={() => setIsOpen(true)}>
        <span className={styles.trigger__icon}>
          <SchoolIcon />
        </span>
        <span className={styles.trigger__text}>
          <span className={styles.trigger__eyebrow}>발전소</span>
          <span className={styles.trigger__name}>
            {isRoot ? '충청남도 전체' : (SCHOOLS.find((school) => school.id === currentPlantId)?.name ?? '')}
          </span>
        </span>
        <span className={styles.trigger__action}>변경</span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        size="lg"
        title="발전소 선택"
        description="학교 이름이나 주소로 찾을 수 있습니다. 고른 뒤 좌측 구조 트리에서 인버터 아래까지 좁힐 수 있습니다."
      >
        <div className={styles.filters}>
          <label className={styles.search}>
            <span className={styles.search__label}>발전소 검색</span>
            <input
              type="search"
              className={styles.search__input}
              value={query}
              placeholder="학교 이름 또는 주소"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <Select label="시·군" value={regionCode} options={REGION_OPTIONS} onChange={setRegionCode} hideLabel />
        </div>

        {/* 전체 합산 조회는 교육청 계정의 권한이다. */}
        {!isScoped ? (
          <button
            type="button"
            className={cn(styles.all, { [styles['all--selected']]: isRoot })}
            onClick={() => choose(ROOT_ID)}
          >
            <span className={styles.all__text}>
              <span className={styles.all__name}>충청남도 전체</span>
              <span className={styles.all__meta}>관내 {formatNumber(SCHOOLS.length)}개 발전소를 합산해서 봅니다</span>
            </span>
            {isRoot ? <CheckIcon className={styles.all__check} /> : null}
          </button>
        ) : (
          <p className={styles.count}>담당 학교의 발전소만 조회할 수 있습니다.</p>
        )}

        <p className={styles.count}>{formatNumber(results.length)}개 발전소</p>

        {results.length === 0 ? (
          <EmptyState title="조건에 맞는 발전소가 없습니다" description="검색어나 시·군을 바꿔 보세요." />
        ) : (
          <ul className={styles.list}>
            {results.map((school) => {
              const isCurrent = currentPlantId === school.id;

              return (
                <li key={school.id}>
                  <button
                    type="button"
                    className={cn(styles.item, { [styles['item--selected']]: isCurrent })}
                    onClick={() => choose(school.id)}
                    aria-pressed={isCurrent}
                  >
                    <span className={styles.item__main}>
                      <span className={styles.item__name}>
                        {school.name}
                        {isCurrent ? <CheckIcon className={styles.item__check} /> : null}
                      </span>
                      <span className={styles.item__address}>{school.address}</span>
                    </span>

                    <span className={styles.item__capacity}>
                      {formatNumber(school.capacityKw, 1)}
                      <span className={styles.item__unit}>kW</span>
                    </span>

                    <span className={styles.item__status}>
                      <span className={styles.item__statusItem}>
                        <span className={styles.item__statusLabel}>발전소</span>
                        <Badge tone={OPERATION_TONE[school.status]} withDot>
                          {OPERATION_LABEL[school.status]}
                        </Badge>
                      </span>
                      <span className={styles.item__statusItem}>
                        <span className={styles.item__statusLabel}>일사량계</span>
                        <Badge tone={RTU_TONE[school.pyranometerStatus]} withDot>
                          {RTU_LABEL[school.pyranometerStatus]}
                        </Badge>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Modal>
    </>
  );
}
