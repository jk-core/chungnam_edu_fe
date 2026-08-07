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
import { DEFAULT_PAGE_SIZE, Pagination } from '@/components/common/Pagination';
import { Reveal } from '@/components/common/Reveal';
import { SCHOOL_LEVELS, SCHOOLS } from '@/mocks/schools';
import { REGIONS } from '@/mocks/regions';
import { Select } from '@/components/common/Select';
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

/** 신규 등록 초안 — 수정 초안과 달리 발전소 자체를 세우므로 소재·설치 정보까지 받는다 (SFR-016-01) */
interface NewDraft {
  plantName: string;
  regionCode: string;
  level: string;
  address: string;
  installedAt: string;
  inverterModel: string;
  builderName: string;
  builderPhone: string;
  monitoringName: string;
  monitoringPhone: string;
  customerName: string;
  customerPhone: string;
  moduleModel: string;
  wattPerPanel: number | '';
  panelCount: number | '';
}

const EMPTY_NEW: NewDraft = {
  plantName: '',
  regionCode: REGIONS[0].code,
  level: SCHOOL_LEVELS[0],
  address: '',
  installedAt: NOW.format('YYYY-MM'),
  inverterModel: '',
  builderName: '',
  builderPhone: '',
  monitoringName: '',
  monitoringPhone: '',
  customerName: '',
  customerPhone: '',
  moduleModel: '',
  wattPerPanel: '',
  panelCount: '',
};

/**
 * 등록 정보를 목록 행으로 옮긴다.
 * 새로 세운 발전소는 아직 계측값이 없으므로 발전량은 0, 상태는 준비중으로 둔다 (SFR-003-10).
 */
function toSchoolRow(asset: PlantAsset): School {
  const region = REGIONS.find((item) => asset.address.includes(item.name)) ?? REGIONS[0];

  return {
    id: asset.plantId,
    name: asset.plantName,
    regionCode: region.code,
    regionName: region.name,
    level: SCHOOL_LEVELS[0],
    address: asset.address,
    capacityKw: computeCapacity(asset.module),
    inverterCount: 0,
    pyranometerStatus: 'disconnected',
    todayKwh: 0,
    monthKwh: 0,
    yearKwh: 0,
    utilization: 0,
    status: 'ready',
    installedAt: asset.installedAt,
    location: region.center,
  };
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
  const plantCreated = useAssetStore((state) => state.plantCreated);
  const createPlant = useAssetStore((state) => state.createPlant);
  const nextPlantId = useAssetStore((state) => state.nextPlantId);
  const changes = useAssetStore((state) => state.changes);
  const saveAsset = useAssetStore((state) => state.saveAsset);
  const plantDeleted = useAssetStore((state) => state.plantDeleted);
  const removePlant = useAssetStore((state) => state.removePlant);

  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [creating, setCreating] = useState<NewDraft | null>(null);
  const [deleting, setDeleting] = useState<School | null>(null);

  // 새로 등록한 발전소를 앞에 세운다 — 방금 넣은 것이 목록 끝에 묻히면 확인이 어렵다.
  const all = useMemo(
    () => [...plantCreated.map(toSchoolRow), ...SCHOOLS].filter((school) => !plantDeleted.includes(school.id)),
    [plantCreated, plantDeleted],
  );

  const rows = useMemo(() => {
    const trimmed = keyword.trim();

    return trimmed
      ? all.filter((school) => school.name.includes(trimmed) || school.regionName.includes(trimmed))
      : all;
  }, [keyword, all]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const editing = editingId ? mergeAsset(editingId, assetPatched, plantCreated) : null;
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

  // 모듈 스펙만 넣으면 총 용량이 바로 잡힌다 (SFR-016-03) — 등록 폼도 수정 폼과 같은 셈을 쓴다.
  const newCapacity = creating && creating.wattPerPanel !== '' && creating.panelCount !== ''
    ? computeCapacity({
      model: creating.moduleModel,
      wattPerPanel: creating.wattPerPanel,
      panelCount: creating.panelCount,
      seriesCount: 1,
    })
    : null;

  const canCreate = Boolean(
    creating
    && creating.plantName.trim()
    && creating.address.trim()
    && creating.moduleModel.trim()
    && creating.wattPerPanel !== ''
    && creating.panelCount !== '',
  );

  const commitCreate = () => {
    if (!creating || !canCreate || creating.wattPerPanel === '' || creating.panelCount === '') return;

    const region = REGIONS.find((item) => item.code === creating.regionCode) ?? REGIONS[0];
    const plantId = nextPlantId();
    // 목록 행은 주소에서 시·군을 되읽으므로 주소 앞에 시·군을 세워 둔다.
    const address = creating.address.includes(region.name)
      ? creating.address.trim()
      : `충청남도 ${region.name} ${creating.address.trim()}`;

    const asset: PlantAsset = {
      plantId,
      plantName: creating.plantName.trim(),
      address,
      installedAt: creating.installedAt.trim(),
      builder: { name: creating.builderName.trim(), phone: creating.builderPhone.trim() },
      monitoring: { name: creating.monitoringName.trim(), phone: creating.monitoringPhone.trim() },
      customer: { name: creating.customerName.trim(), phone: creating.customerPhone.trim() },
      inverterModel: creating.inverterModel.trim(),
      module: {
        model: creating.moduleModel.trim(),
        wattPerPanel: creating.wattPerPanel,
        panelCount: creating.panelCount,
        seriesCount: 1,
      },
    };

    createPlant(asset, {
      id: `AC-${NOW.format('MMDDHHmm')}-${plantId}`,
      plantId,
      plantName: asset.plantName,
      at: NOW.format('YYYY-MM-DD HH:mm'),
      actor: user?.name ?? '관리자',
      field: '신규 등록',
      before: '—',
      after: `${formatNumber(computeCapacity(asset.module), 1)}kW · ${creating.level}`,
    });

    toast.success(MSG.createSuccess(asset.plantName));
    setCreating(null);
  };

  const openEditor = (plantId: string) => {
    const asset = mergeAsset(plantId, assetPatched, plantCreated);

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
      width: '140px',
      align: 'center',
      render: (row) => (
        <span className={styles.toolbar__actions}>
          <Button size="sm" variant="secondary" onClick={() => openEditor(row.id)}>
            수정
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleting(row)}>
            삭제
          </Button>
        </span>
      ),
    },
  ];

  return (
    <div className={styles.tab}>
      <div className={styles.toolbar}>
        <div className={styles.toolbar__left}>
          <TextField
            label="이름 검색"
            hideLabel
            value={keyword}
            onChange={(value) => {
              setKeyword(value);
              setPage(1);
            }}
            placeholder="발전소명으로 검색"
            width="md"
          />
        </div>
        <div className={styles.toolbar__left}>
          <p className={styles.toolbar__note}>총 {formatNumber(rows.length)}개</p>
          <Button size="sm" onClick={() => setCreating(EMPTY_NEW)}>발전소 등록</Button>
        </div>
      </div>

      <Reveal>
        <Card
          eyebrow="Plants"
          title="발전소 목록"
          description="위 등록 버튼으로 발전소를 새로 세우고, 행의 수정 버튼으로 등록 정보를 고칩니다. 변경 내역은 아래 이력에 남습니다."
        >
          <Table caption="발전소 등록 목록" columns={columns} rows={pageRows} getRowKey={(row) => row.id} />
          <Pagination
            page={currentPage}
            pageCount={pageCount}
            totalCount={rows.length}
            onChange={setPage}
            label="발전소 목록"
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
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

      {/* 발전소 신규 등록 (SFR-016-01~04) */}
      <Modal
        isOpen={creating !== null}
        onClose={() => setCreating(null)}
        size="lg"
        title="발전소 등록"
        description="설비용량은 모듈 정보에서 자동으로 계산됩니다."
        footer={(
          <>
            <Button variant="secondary" onClick={() => setCreating(null)}>
              취소
            </Button>
            <Button onClick={commitCreate} disabled={!canCreate}>
              등록
            </Button>
          </>
        )}
      >
        {creating ? (
          <div className={styles.form}>
            <FormSection legend="발전소 정보" hint="시·군은 지도 위 마커 자리를 정하는 데 쓰입니다.">
              <FormRow cols={2}>
                <TextField
                  label="발전소명"
                  value={creating.plantName}
                  onChange={(value) => setCreating({ ...creating, plantName: value })}
                  placeholder="예: 온양초등학교"
                  required
                />
                <Select
                  label="시·군"
                  value={creating.regionCode}
                  options={REGIONS.map((item) => ({ value: item.code, label: item.name }))}
                  onChange={(value) => setCreating({ ...creating, regionCode: value })}
                />
              </FormRow>
              <FormRow cols={2}>
                <Select
                  label="학교급"
                  value={creating.level}
                  options={SCHOOL_LEVELS.map((item) => ({ value: item, label: item }))}
                  onChange={(value) => setCreating({ ...creating, level: value })}
                />
                <TextField
                  label="설치 시기"
                  value={creating.installedAt}
                  onChange={(value) => setCreating({ ...creating, installedAt: value })}
                  hint="YYYY-MM"
                  ime="numeric"
                />
              </FormRow>
              <TextField
                label="주소"
                value={creating.address}
                onChange={(value) => setCreating({ ...creating, address: value })}
                placeholder="시·군 뒤 상세 주소"
                width="full"
                required
              />
            </FormSection>

            <FormSection legend="시공·관리 업체" hint="연락처는 고장 대응 시 바로 쓰입니다.">
              <FormRow cols={2}>
                <TextField
                  label="시공 업체"
                  value={creating.builderName}
                  onChange={(value) => setCreating({ ...creating, builderName: value })}
                />
                <TextField
                  label="시공 업체 연락처"
                  value={creating.builderPhone}
                  onChange={(value) => setCreating({ ...creating, builderPhone: value })}
                  ime="numeric"
                />
              </FormRow>
              <FormRow cols={2}>
                <TextField
                  label="모니터링 업체"
                  value={creating.monitoringName}
                  onChange={(value) => setCreating({ ...creating, monitoringName: value })}
                />
                <TextField
                  label="모니터링 업체 연락처"
                  value={creating.monitoringPhone}
                  onChange={(value) => setCreating({ ...creating, monitoringPhone: value })}
                  ime="numeric"
                />
              </FormRow>
            </FormSection>

            <FormSection legend="수용가" hint="개인정보라 목록·상세에서는 가려서 보여 줍니다.">
              <FormRow cols={2}>
                <TextField
                  label="수용가명"
                  value={creating.customerName}
                  onChange={(value) => setCreating({ ...creating, customerName: value })}
                />
                <TextField
                  label="수용가 연락처"
                  value={creating.customerPhone}
                  onChange={(value) => setCreating({ ...creating, customerPhone: value })}
                  ime="numeric"
                />
              </FormRow>
            </FormSection>

            <FormSection legend="설비 정보" hint="출력과 장수를 넣으면 총 설비용량이 자동 계산됩니다.">
              <FormRow cols={3}>
                <TextField
                  label="모듈 모델"
                  value={creating.moduleModel}
                  onChange={(value) => setCreating({ ...creating, moduleModel: value })}
                  ime="latin"
                  required
                />
                <NumberField
                  label="1장 출력"
                  value={creating.wattPerPanel}
                  onChange={(value) => setCreating({ ...creating, wattPerPanel: value })}
                  unit="W"
                  required
                />
                <NumberField
                  label="모듈 장수"
                  value={creating.panelCount}
                  onChange={(value) => setCreating({ ...creating, panelCount: value })}
                  unit="장"
                  required
                />
              </FormRow>
              <TextField
                label="인버터 모델"
                value={creating.inverterModel}
                onChange={(value) => setCreating({ ...creating, inverterModel: value })}
                ime="latin"
              />

              <div className={styles.capacity}>
                <span className={styles.capacity__label}>산출 설비용량</span>
                <span className={styles.capacity__value}>
                  {newCapacity === null ? '—' : `${formatNumber(newCapacity, 1)} kW`}
                </span>
                <span className={styles.capacity__note}>모듈 출력 × 장수로 계산합니다</span>
              </div>
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

      <ConfirmDialog
        isOpen={deleting !== null}
        title={MSG.deleteConfirm(deleting?.name ?? '발전소')}
        description="딸린 RTU·인버터·접속반·스트링·일사량계도 시스템장비 관리에서 함께 감춰집니다."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={() => {
          if (!deleting) return;

          removePlant(deleting.id, {
            // 같은 발전소의 등록 이력과 id 가 겹치지 않게 갈래를 붙인다 — 목록 key 로 쓰인다.
            id: `AC-${NOW.format('MMDDHHmm')}-${deleting.id}-del`,
            plantId: deleting.id,
            plantName: deleting.name,
            at: NOW.format('YYYY-MM-DD HH:mm'),
            actor: user?.name ?? '관리자',
            field: '발전소 삭제',
            before: `${formatNumber(deleting.capacityKw, 1)}kW · ${deleting.regionName}`,
            after: '—',
          });
          toast.success(MSG.deleteSuccess(deleting.name));
          setDeleting(null);
        }}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
