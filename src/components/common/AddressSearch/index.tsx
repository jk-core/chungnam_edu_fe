import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { findAddresses } from '@/mocks/addresses';
import { Modal } from '@/components/common/Modal';
import { SearchIcon } from '@/components/common/Icon';
import { SearchInput } from '@/components/common/SearchInput';
import type { AddressResult } from '@/interface/address';
import styles from './AddressSearch.module.scss';

interface AddressSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (address: AddressResult) => void;
}

/**
 * 주소 검색 (SFR-016-02).
 *
 * 카카오(다음) 우편번호 서비스가 들어올 자리다. 아직 SDK 가 없어 목업 목록으로 대신하되,
 * 돌려주는 값(`AddressResult`)은 그쪽 `onComplete` 규격을 그대로 따른다 — 붙일 때 이 파일의
 * 본문만 임베드로 갈아 끼우면 되고, 소비하는 폼은 손대지 않는다.
 */
export function AddressSearchModal({ isOpen, onClose, onSelect }: AddressSearchModalProps) {
  const [draft, setDraft] = useState('');
  const [keyword, setKeyword] = useState('');

  const found = findAddresses(keyword);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="주소 검색"
      description="도로명·지번·건물명 어느 것으로도 찾을 수 있습니다."
    >
      <div className={styles.search}>
        <form
          className={styles.search__form}
          onSubmit={(event) => {
            event.preventDefault();
            setKeyword(draft);
          }}
        >
          <SearchInput
            label="주소 검색"
            value={draft}
            onChange={setDraft}
            placeholder="예: 홍북읍 선화로 22, 충남교육청"
            width="full"
          />
          <Button type="submit" variant="secondary" iconLeft={<SearchIcon />}>검색</Button>
        </form>

        {keyword ? null : (
          <div className={styles.search__guide}>
            <span>· 도로명 + 건물번호 — 선화로 22</span>
            <span>· 지역명 + 건물명 — 홍성 교육청</span>
            <span>· 우편번호 — 32255</span>
          </div>
        )}

        {keyword && found.length === 0 ? (
          <EmptyState
            title="검색 결과가 없습니다"
            description="도로명이나 건물명을 더 짧게 넣어 다시 찾아보세요."
          />
        ) : null}

        {found.length > 0 ? (
          <div className={styles.search__results}>
            <div className={styles.search__list}>
              {found.map((item) => (
                <button
                  key={`${item.zonecode}-${item.roadAddress}`}
                  type="button"
                  className={styles.item}
                  onClick={() => onSelect(item)}
                >
                  <span className={styles.item__zonecode}>{item.zonecode}</span>
                  <span className={styles.item__body}>
                    <span className={styles.item__road}>
                      {item.roadAddress}
                      {item.buildingName ? <span className={styles.item__building}> ({item.buildingName})</span> : null}
                    </span>
                    <span className={styles.item__jibun}>지번 {item.jibunAddress}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
