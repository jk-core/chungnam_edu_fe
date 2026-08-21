import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { createPath } from '@/pages/Admin/_shared/adminPath';
import { deletedEntry } from '@/pages/Admin/_shared/device/deviceChangeLog';
import { DeviceHistory } from '@/pages/Admin/_shared/device/DeviceHistory';
import { formatNumber } from '@/utils/format';
import { MSG } from '@/configs/messages';
import { PlusIcon } from '@/components/common/Icon';
import { TextField } from '@/components/common/Form';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import { useInverterProducts } from '@/pages/Admin/_shared/device/useSelectableEquipment';
import useEquipmentStore, { mergeEquipment } from '@/stores/equipmentStore';
import type { InverterProduct } from '@/interface/deviceMaster';
import styles from '@/pages/Admin/Admin.module.scss';
import { InverterTable } from './InverterTable';

/**
 * 인버터 제품 마스터 관리 (SFR-017-04).
 * 검색 줄과 표가 같은 목록을 봐야 하므로 거르는 일만 여기서 한 번 한다.
 */
export function InverterBoard() {
  const removeInverter = useEquipmentStore((state) => state.removeInverter);
  const equipmentCreated = useEquipmentStore((state) => state.equipmentCreated);
  const equipmentPatched = useEquipmentStore((state) => state.equipmentPatched);
  const equipmentDeleted = useEquipmentStore((state) => state.equipmentDeleted);
  const actor = useAuthUser();
  const products = useInverterProducts();
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');
  const [deleting, setDeleting] = useState<InverterProduct | null>(null);

  const rows = useMemo(() => {
    const trimmed = keyword.trim();

    return trimmed
      ? products.filter((item) => item.name.includes(trimmed)
        || item.maker.includes(trimmed)
        || String(item.inverterId).includes(trimmed))
      : products;
  }, [products, keyword]);

  // 어느 설비가 이 제품을 쓰는지 — 삭제 확인에 몇 대가 걸려 있는지 적어 준다.
  const usage = useMemo(() => {
    const counts = new Map<string, number>();

    mergeEquipment(equipmentCreated, equipmentPatched, equipmentDeleted).forEach((item) => {
      counts.set(item.inverterProductId, (counts.get(item.inverterProductId) ?? 0) + 1);
    });

    return counts;
  }, [equipmentCreated, equipmentPatched, equipmentDeleted]);

  const inUse = deleting ? usage.get(deleting.id) ?? 0 : 0;

  const remove = () => {
    if (!deleting) return;

    removeInverter(deleting.id, deletedEntry(
      { kind: 'inverter', id: deleting.id, name: deleting.name, actor: actor?.name ?? '관리자' },
      `${deleting.maker} · ${formatNumber(deleting.capacityKw, 1)}kW`,
    ));
    toast.success(MSG.deleteSuccess(deleting.name));
    setDeleting(null);
  };

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbar__left}>
          <TextField
            label="이름 검색"
            hideLabel
            value={keyword}
            onChange={setKeyword}
            placeholder="인버터 이름·업체 이름으로 검색"
            width="md"
          />
          <p className={styles.toolbar__note}>총 {formatNumber(rows.length)}개</p>
        </div>
        <div className={styles.toolbar__actions}>
          <Button iconLeft={<PlusIcon />} onClick={() => navigate(createPath('devices', 'inverter'))}>
            인버터 등록
          </Button>
        </div>
      </div>

      <InverterTable rows={rows} usage={usage} onDelete={setDeleting} />

      <DeviceHistory kind="inverter" keyword={keyword} title="인버터 제품 변경 이력" />

      <ConfirmDialog
        isOpen={deleting !== null}
        title={MSG.deleteConfirm(deleting?.name ?? '인버터 제품')}
        description={inUse > 0
          ? `이 제품을 쓰는 설비가 ${formatNumber(inUse)}대 있습니다. 삭제하면 해당 설비의 인버터를 다시 골라야 합니다.`
          : '등록 이력에는 삭제한 사실이 남습니다.'}
        confirmLabel="삭제"
        tone="danger"
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
