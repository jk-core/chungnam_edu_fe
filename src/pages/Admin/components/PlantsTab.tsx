import { useMemo, useState } from 'react';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { computeCapacity } from '@/mocks/assetMaster';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { FormRow, FormSection, NumberField, TextField } from '@/components/common/Form';
import { MaskedText } from '@/components/common/MaskedText';
import { maskName, maskPhone } from '@/utils/mask';
import { Modal } from '@/components/common/Modal';
import { MSG } from '@/configs/messages';
import { NOW } from '@/mocks/today';
import { OPERATION_LABEL, OPERATION_TONE } from '@/mocks/status';
import { Reveal } from '@/components/common/Reveal';
import { SCHOOLS } from '@/mocks/schools';
import { Table } from '@/components/common/Table';
import { formatNumber } from '@/utils/format';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import useAssetStore, { mergeAsset, mergeChanges } from '@/stores/assetStore';
import type { AssetChange, PlantAsset } from '@/interface/asset';
import type { Column } from '@/components/common/Table';
import type { School } from '@/interface/energy';
import styles from '../Admin.module.scss';

interface Draft {
  builderName: string;
  builderPhone: string;
  monitoringName: string;
  monitoringPhone: string;
  moduleModel: string;
  wattPerPanel: number | '';
  panelCount: number | '';
}

function draftOf(asset: PlantAsset): Draft {
  return {
    builderName: asset.builder.name,
    builderPhone: asset.builder.phone,
    monitoringName: asset.monitoring.name,
    monitoringPhone: asset.monitoring.phone,
    moduleModel: asset.module.model,
    wattPerPanel: asset.module.wattPerPanel,
    panelCount: asset.module.panelCount,
  };
}

/** 발전소·설비 등록 및 수정 (SFR-016) */
export function PlantsTab() {
  const user = useAuthUser();
  const assetPatched = useAssetStore((state) => state.assetPatched);
  const changes = useAssetStore((state) => state.changes);
  const saveAsset = useAssetStore((state) => state.saveAsset);

  const [keyword, setKeyword] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirming, setConfirming] = useState(false);

  const rows = useMemo(() => {
    const trimmed = keyword.trim();

    return trimmed
      ? SCHOOLS.filter((school) => school.name.includes(trimmed) || school.regionName.includes(trimmed))
      : SCHOOLS;
  }, [keyword]);

  const editing = editingId ? mergeAsset(editingId, assetPatched) : null;
  const history = useMemo(() => mergeChanges(changes), [changes]);

  // 모듈 스펙을 바꾸면 총 용량이 즉시 다시 계산된다 (SFR-016-03).
  const draftCapacity = draft && draft.wattPerPanel !== '' && draft.panelCount !== ''
    ? computeCapacity({
      model: draft.moduleModel,
      wattPerPanel: draft.wattPerPanel,
      panelCount: draft.panelCount,
      seriesCount: 1,
    })
    : null;

  const openEditor = (plantId: string) => {
    const asset = mergeAsset(plantId, assetPatched);

    if (!asset) return;

    setEditingId(plantId);
    setDraft(draftOf(asset));
  };

  const close = () => {
    setEditingId(null);
    setDraft(null);
  };

  const commit = () => {
    if (!editing || !draft || draft.wattPerPanel === '' || draft.panelCount === '') return;

    const nextAsset: Partial<PlantAsset> = {
      builder: { name: draft.builderName.trim(), phone: draft.builderPhone.trim() },
      monitoring: { name: draft.monitoringName.trim(), phone: draft.monitoringPhone.trim() },
      module: {
        model: draft.moduleModel.trim(),
        wattPerPanel: draft.wattPerPanel,
        panelCount: draft.panelCount,
        seriesCount: editing.module.seriesCount,
      },
    };

    // 무엇이 바뀌었는지 필드 단위로 이력에 남긴다 (SFR-016-06).
    const entries: AssetChange[] = [];
    const pushEntry = (field: string, before: string, after: string) => {
      if (before === after) return;

      entries.push({
        id: `AC-${NOW.format('MMDDHHmm')}-${editing.plantId}-${entries.length}`,
        plantId: editing.plantId,
        plantName: editing.plantName,
        at: NOW.format('YYYY-MM-DD HH:mm'),
        actor: user?.name ?? '관리자',
        field,
        before,
        after,
      });
    };

    const next = { builder: nextAsset.builder, monitoring: nextAsset.monitoring, module: nextAsset.module };

    if (next.builder && next.monitoring && next.module) {
      pushEntry('시공 업체', editing.builder.name, next.builder.name);
      pushEntry('시공 업체 연락처', editing.builder.phone, next.builder.phone);
      pushEntry('모니터링 업체', editing.monitoring.name, next.monitoring.name);
      pushEntry('모니터링 업체 연락처', editing.monitoring.phone, next.monitoring.phone);
      pushEntry('모듈 모델', editing.module.model, next.module.model);
      pushEntry('모듈 1장 출력', `${editing.module.wattPerPanel}W`, `${next.module.wattPerPanel}W`);
      pushEntry('모듈 장수', `${editing.module.panelCount}장`, `${next.module.panelCount}장`);
    }

    if (entries.length === 0) {
      toast.info('바뀐 내용이 없습니다.');
      close();

      return;
    }

    saveAsset(editing.plantId, nextAsset, entries);
    toast.success(MSG.updateSuccess(editing.plantName));
    close();
  };

  const columns: Column<School>[] = [
    {
      key: 'name',
      header: '발전소',
      render: (row) => (
        <>
          <strong>{row.name}</strong>
          <span className={styles.toolbar__note}> · {row.regionName}</span>
        </>
      ),
    },
    {
      key: 'capacity',
      header: '설비용량',
      align: 'right',
      width: '110px',
      render: (row) => `${formatNumber(row.capacityKw, 1)} kW`,
    },
    {
      key: 'inverter',
      header: '인버터',
      align: 'right',
      width: '80px',
      hideOnTablet: true,
      render: (row) => `${row.inverterCount}대`,
    },
    { key: 'installed', header: '설치 시기', width: '100px', hideOnTablet: true, render: (row) => row.installedAt },
    {
      key: 'status',
      header: '상태',
      width: '110px',
      render: (row) => (
        <Badge tone={OPERATION_TONE[row.status]} withDot>
          {OPERATION_LABEL[row.status]}
        </Badge>
      ),
    },
    {
      key: 'action',
      header: '관리',
      width: '90px',
      align: 'center',
      render: (row) => (
        <Button size="sm" variant="secondary" onClick={() => openEditor(row.id)}>
          수정
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.tab}>
      <div className={styles.toolbar}>
        <div className={styles.toolbar__left}>
          <TextField
            label="발전소 검색"
            value={keyword}
            onChange={setKeyword}
            placeholder="학교명·시군 검색"
            width="md"
          />
        </div>
        <p className={styles.toolbar__note}>{formatNumber(rows.length)}개소</p>
      </div>

      <Reveal>
        <Card
          eyebrow="Plants"
          title="발전소 목록"
          description="행의 수정 버튼으로 등록 정보를 고칩니다. 변경 내역은 아래 이력에 남습니다."
        >
          <Table caption="발전소 등록 목록" columns={columns} rows={rows} getRowKey={(row) => row.id} />
        </Card>
      </Reveal>

      <Reveal delay={0.06}>
        <Card eyebrow="History" title="수정 이력" description="누가 언제 무엇을 바꿨는지 필드 단위로 남습니다.">
          <div className={styles.history}>
            {history.slice(0, 8).map((item) => (
              <div key={item.id} className={styles.historyItem}>
                <span className={styles.historyItem__at}>{item.at}</span>
                <span className={styles.historyItem__body}>
                  <strong>{item.plantName}</strong> · {item.field} —{' '}
                  <span className={styles.historyItem__diff}>
                    <del>{item.before}</del> → <ins>{item.after}</ins>
                  </span>
                </span>
                <span className={styles.historyItem__at}>{item.actor}</span>
              </div>
            ))}
          </div>
        </Card>
      </Reveal>

      <Modal
        isOpen={editing !== null}
        onClose={close}
        size="lg"
        title={`${editing?.plantName ?? ''} 등록 정보`}
        description={editing ? `${editing.address} · 설치 ${editing.installedAt}` : undefined}
        footer={(
          <>
            <Button variant="secondary" onClick={close}>
              취소
            </Button>
            <Button onClick={() => setConfirming(true)}>저장</Button>
          </>
        )}
      >
        {editing && draft ? (
          <div className={styles.form}>
            <FormSection legend="시공·관리 업체" hint="연락처는 고장 대응 시 바로 쓰입니다.">
              <FormRow cols={2}>
                <TextField
                  label="시공 업체"
                  value={draft.builderName}
                  onChange={(value) => setDraft({ ...draft, builderName: value })}
                  required
                />
                <TextField
                  label="시공 업체 연락처"
                  value={draft.builderPhone}
                  onChange={(value) => setDraft({ ...draft, builderPhone: value })}
                  ime="numeric"
                />
              </FormRow>
              <FormRow cols={2}>
                <TextField
                  label="모니터링 업체"
                  value={draft.monitoringName}
                  onChange={(value) => setDraft({ ...draft, monitoringName: value })}
                  required
                />
                <TextField
                  label="모니터링 업체 연락처"
                  value={draft.monitoringPhone}
                  onChange={(value) => setDraft({ ...draft, monitoringPhone: value })}
                  ime="numeric"
                />
              </FormRow>
            </FormSection>

            <FormSection legend="모듈 정보" hint="출력과 장수를 넣으면 총 설비용량이 자동 계산됩니다.">
              <FormRow cols={3}>
                <TextField
                  label="모듈 모델"
                  value={draft.moduleModel}
                  onChange={(value) => setDraft({ ...draft, moduleModel: value })}
                  ime="latin"
                  required
                />
                <NumberField
                  label="1장 출력"
                  value={draft.wattPerPanel}
                  onChange={(value) => setDraft({ ...draft, wattPerPanel: value })}
                  unit="W"
                  min={100}
                  max={800}
                  required
                />
                <NumberField
                  label="모듈 장수"
                  value={draft.panelCount}
                  onChange={(value) => setDraft({ ...draft, panelCount: value })}
                  unit="장"
                  min={1}
                  max={5000}
                  required
                />
              </FormRow>

              <div className={styles.capacity}>
                <span className={styles.capacity__label}>산출 설비용량</span>
                <span className={styles.capacity__value}>
                  {draftCapacity !== null ? `${formatNumber(draftCapacity, 1)} kW` : '—'}
                </span>
                <span className={styles.capacity__note}>
                  현재 등록 {formatNumber((editing.module.wattPerPanel * editing.module.panelCount) / 1000, 1)} kW
                </span>
              </div>
            </FormSection>

            <FormSection legend="수용가 정보" hint="계약자 개인정보는 가려서 보여 주고, 필요할 때만 눌러서 확인합니다.">
              <dl className={styles.infoGrid}>
                <div>
                  <dt>계약자</dt>
                  <dd>
                    <MaskedText masked={maskName(editing.customer.name)} original={editing.customer.name} label="계약자 이름" />
                  </dd>
                </div>
                <div>
                  <dt>연락처</dt>
                  <dd>
                    <MaskedText masked={maskPhone(editing.customer.phone)} original={editing.customer.phone} label="계약자 연락처" />
                  </dd>
                </div>
                <div>
                  <dt>인버터 모델</dt>
                  <dd>{editing.inverterModel}</dd>
                </div>
              </dl>
            </FormSection>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        isOpen={confirming}
        title={MSG.updateConfirm(editing?.plantName ?? '발전소')}
        description="바뀐 항목만 수정 이력에 남습니다."
        confirmLabel="저장"
        onConfirm={commit}
        onClose={() => setConfirming(false)}
      />
    </div>
  );
}
