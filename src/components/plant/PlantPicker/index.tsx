import { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { OPERATION_LABEL, OPERATION_TONE, RTU_LABEL, RTU_TONE } from '@/mocks/status';
import { CheckIcon, SchoolIcon, SearchIcon } from '@/components/common/Icon';
import { EmptyState } from '@/components/common/EmptyState';
import { KIND_LABEL } from '@/mocks/tree';
import { Modal } from '@/components/common/Modal';
import { CHUNGNAM_REGIONS } from '@/configs/regions';
import { SCHOOLS } from '@/mocks/schools';
import { Select } from '@/components/common/Select';
import { cn } from '@/utils/cn';
import { formatCapacity, formatNumber } from '@/utils/format';
import { useAllowedPlantIds } from '@/hooks/useScopeClamp';
import { usePlantScope } from '@/hooks/usePlantScope';
import { useSelectNode } from '@/stores/plantStore';
import styles from './PlantPicker.module.scss';

const REGION_OPTIONS = [
  { value: 'all', label: '전체 지역' },
  ...CHUNGNAM_REGIONS.map((region) => ({ value: region.code, label: region.name })),
];

interface PlantPickerProps {
  /**
   * summary 는 좌측 컬럼용 — 선택 버튼과 대상 요약(주소·용량·상태)을 한 줄에 합친다.
   * 따로 두면 좁은 컬럼에서 같은 내용이 두 번 자리를 먹는다.
   */
  variant?: 'inline' | 'summary';
}

/**
 * 발전소 선택기. 128개를 드롭다운에 담기 어려워 검색·필터가 있는 모달로 펼친다.
 * 발전소 아래 인버터·스트링은 좌측 설비 구조 트리에서 고른다.
 */
export function PlantPicker({ variant = 'inline' }: PlantPickerProps) {
  const { node, plant } = usePlantScope();
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

  const currentPlantId = node.plantId;
  // 용량은 지금 보고 있는 계층 기준이다. 인버터까지 좁히면 그 인버터 용량이 나온다.
  const capacity = formatCapacity(node.capacityKw);

  const choose = (id: string) => {
    selectNode(id);
    setIsOpen(false);
  };

  return (
    <>
      {variant === 'summary' ? (
        <button
          type="button"
          className={cn(styles.trigger, styles['trigger--summary'])}
          onClick={() => setIsOpen(true)}
          aria-label={`조회 대상 ${node.name}. 누르면 발전소를 바꿉니다.`}
        >
          <span className={styles.trigger__icon}>
            <SearchIcon />
          </span>

          <span className={styles.trigger__text}>
            <span className={styles.trigger__name}>{node.name}</span>
            {/* 주소는 길면 잘리고 용량은 끝까지 남는다 — 좁은 칸에서 먼저 지킬 값이다. */}
            <span className={styles.trigger__meta}>
              <span className={styles.trigger__address}>{plant?.address ?? ''}</span>
              <span className={styles.trigger__capacity}>
                <span className={styles.trigger__dot} aria-hidden="true">·</span>
                {capacity.value} {capacity.unit}
              </span>
            </span>
          </span>

          <span className={styles.trigger__status}>
            <span className={styles.trigger__statusRow}>
              <span className={styles.trigger__statusLabel}>
                {KIND_LABEL[node.kind]}
              </span>
              <Badge tone={OPERATION_TONE[node.status]} withDot>
                {OPERATION_LABEL[node.status]}
              </Badge>
            </span>

            <span className={styles.trigger__statusRow}>
              <span className={styles.trigger__statusLabel}>일사량계</span>
              {plant ? (
                <Badge tone={RTU_TONE[plant.pyranometerStatus]} withDot>
                  {RTU_LABEL[plant.pyranometerStatus]}
                </Badge>
              ) : null}
            </span>
          </span>
        </button>
      ) : (
        <button type="button" className={styles.trigger} onClick={() => setIsOpen(true)}>
          <span className={styles.trigger__icon}>
            <SchoolIcon />
          </span>
          <span className={styles.trigger__text}>
            <span className={styles.trigger__eyebrow}>발전소</span>
            <span className={styles.trigger__name}>
              {SCHOOLS.find((school) => school.id === currentPlantId)?.name ?? ''}
            </span>
          </span>
          <span className={styles.trigger__action}>변경</span>
        </button>
      )}

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
          <Select label="지역" value={regionCode} options={REGION_OPTIONS} onChange={setRegionCode} hideLabel />
        </div>

        {/*
          300개 전체 합산 조회는 화면으로 열지 않는다.
          카드·차트·타임라인을 전 학교로 펴면 읽히지도 않고 응답도 무겁다 —
          전체 집계가 필요하면 통합관제 상황판이나 관리자 콘솔에서 본다.
        */}
        {isScoped ? <p className={styles.count}>담당 학교의 발전소만 조회할 수 있습니다.</p> : null}

        <p className={styles.count}>{formatNumber(results.length)}개 발전소</p>

        {results.length === 0 ? (
          <EmptyState title="조건에 맞는 발전소가 없습니다" description="검색어나 지역을 바꿔 보세요." />
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
