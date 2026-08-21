import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { computeEquipmentCapacity, describeInverterProduct, INVERTER_KIND_LABEL } from '@/mocks/deviceMaster';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { createdEntry, diffEntries } from '@/pages/Admin/_shared/device/deviceChangeLog';
import { FormPage } from '@/pages/Admin/_shared/FormPage';
import { FormRow, FormSection, NumberField, TextArea, TextField } from '@/components/common/Form';
import { formatNumber } from '@/utils/format';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import { Modal } from '@/components/common/Modal';
import { MSG } from '@/configs/messages';
import { NOW } from '@/mocks/today';
import { PickerField, RecordPicker } from '@/components/common/RecordPicker';
import { PYRANOMETER_PORT } from '@/mocks/pyranometers';
import { StringRows, validateStringRows } from '@/pages/Admin/Plants/String/components/StringRows';
import { summarizeString, useStringsOf } from '@/pages/Admin/Plants/String/hooks/useStringData';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import { useInverterProducts } from '@/pages/Admin/_shared/device/useSelectableEquipment';
import useEquipmentStore from '@/stores/equipmentStore';
import type { EquipmentMaster, StringMaster } from '@/interface/deviceMaster';
import type { StringDraftRow } from '@/pages/Admin/Plants/String/components/StringRows';
import styles from '@/pages/Admin/Admin.module.scss';
import { useEquipmentRows, useModuleProducts } from '../hooks/useEquipmentRows';
import { useManagedUsers, usePlantAssets } from '../hooks/useEquipmentPickers';
import type { EquipmentRow } from '../hooks/useEquipmentRows';

/** RTU 포트 범위. 3번은 일사량계 몫이라 설비가 못 쓴다. */
const PORT_MIN = 0;
const PORT_MAX = 10;

/** 방위각은 동에서 서까지만 — 정남이 180 이다 */
const AZIMUTH_MIN = 90;
const AZIMUTH_MAX = 270;
const INCLINE_MIN = 0;
const INCLINE_MAX = 90;

/** 모듈 직·병렬 장수 */
const ARRAY_MIN = 0;
const ARRAY_MAX = 1000;

/** AS 만료일 기본값 — 오늘로부터 다섯 해 */
const AS_YEARS = 5;

/** CID 는 기존 체계를 따라 이 값에 일련번호를 더해 만든다 */
const CID_BASE = 10192000000;

/** 폼 위에 띄운 창. 한 번에 하나만 뜬다 */
type Picker = 'user' | 'plant' | 'inverter' | 'module' | 'strings';

interface Draft {
  /** 사용자 번호. 빈 문자열이면 아직 고르지 않은 것 */
  userId: string;
  plantId: string;
  name: string;
  rtuCommId: string;
  rtuPort: number | '';
  inverterProductId: string;
  moduleProductId: string;
  azimuth: number | '';
  inclineAngle: number | '';
  series1: number | '';
  parallel1: number | '';
  series2: number | '';
  parallel2: number | '';
  /** 설비용량(kW) — 모듈 구성에서 산출해 채우되 손으로 고칠 수 있다 */
  equipmentCapacity: number | '';
  asExpiresAt: string;
  note: string;
  installedAt: string;
  operatedAt: string;
}

interface EquipmentEditorProps {
  /** 고칠 설비의 서버 식별자. 없으면 새로 세우는 자리다 */
  cid: number | null;
}

function draftOf(target: EquipmentRow | null): Draft {
  return target
    ? {
      userId: target.userId === null ? '' : String(target.userId),
      plantId: target.plantId,
      name: target.name,
      rtuCommId: target.rtuCommId,
      rtuPort: target.rtuPort ?? '',
      inverterProductId: target.inverterProductId,
      moduleProductId: target.moduleProductId,
      azimuth: target.azimuth,
      inclineAngle: target.inclineAngle,
      series1: target.series1,
      parallel1: target.parallel1,
      series2: target.series2,
      parallel2: target.parallel2,
      equipmentCapacity: target.equipmentCapacity,
      asExpiresAt: target.asExpiresAt,
      note: target.note,
      installedAt: target.installedAt,
      operatedAt: target.operatedAt,
    }
    : {
      userId: '',
      plantId: '',
      name: '',
      rtuCommId: '',
      rtuPort: '',
      inverterProductId: '',
      moduleProductId: '',
      azimuth: 180,
      inclineAngle: 20,
      series1: '',
      parallel1: '',
      series2: 0,
      parallel2: 0,
      equipmentCapacity: '',
      asExpiresAt: NOW.add(AS_YEARS, 'year').format('YYYY-MM-DD'),
      note: '',
      installedAt: '',
      operatedAt: '',
    };
}

/** 설비 등록·수정 (SFR-016-01~04, SFR-017-04) */
export function EquipmentEditor({ cid }: EquipmentEditorProps) {
  const rows = useEquipmentRows();
  const navigate = useNavigate();
  const saveEquipment = useEquipmentStore((state) => state.saveEquipment);
  const saveStrings = useEquipmentStore((state) => state.saveStrings);
  const nextId = useEquipmentStore((state) => state.nextId);
  const nextSeq = useEquipmentStore((state) => state.nextSeq);
  const actor = useAuthUser();
  const modules = useModuleProducts();
  const inverters = useInverterProducts();
  const users = useManagedUsers();
  const plants = usePlantAssets();
  const { listOf } = useStringsOf();

  const target = rows.find((row) => row.cid === cid) ?? null;
  const isNew = target === null;
  const backTo = listPath('plants', 'equipment');

  const [draft, setDraft] = useState<Draft>(() => draftOf(target));
  const [strings, setStrings] = useState<StringDraftRow[]>(() => (target
    ? listOf(target.inverterId).map((row, index) => ({
      key: index + 1,
      id: row.id,
      seq: row.seq,
      name: row.name,
      seriesCount: row.seriesCount,
      parallelCount: row.parallelCount,
    }))
    : []));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [picker, setPicker] = useState<Picker | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const module = modules.find((item) => item.id === draft.moduleProductId);
  const inverter = inverters.find((item) => item.id === draft.inverterProductId);
  const plant = plants.find((item) => item.plantId === draft.plantId);
  const user = users.find((item) => String(item.userId) === draft.userId);
  // 스트링 구조는 스트링 인버터에만 있다 — 센트럴은 접속반·채널로 나뉜다.
  const hasStrings = inverter?.kind === 'string';

  const change = (next: Partial<Draft>) => setDraft({ ...draft, ...next });

  /*
    모듈·직병렬을 만지면 설비용량을 다시 셈해 채운다 (SFR-016-03).
    서버는 `instCapa` 를 값으로 받으므로 폼이 그 값을 들고 있어야 한다 —
    자동으로 채우되 현장 실측이 다르면 손으로 고칠 수 있게 둔다.
  */
  const changeArray = (next: Partial<Draft>) => {
    const merged = { ...draft, ...next };
    const product = modules.find((item) => item.id === merged.moduleProductId);

    if (!product) {
      setDraft(merged);

      return;
    }

    const capacity = computeEquipmentCapacity({
      series1: Number(merged.series1 || 0),
      parallel1: Number(merged.parallel1 || 0),
      series2: Number(merged.series2 || 0),
      parallel2: Number(merged.parallel2 || 0),
    }, product.wattPerPanel);

    setDraft({ ...merged, equipmentCapacity: Math.round(capacity * 1000) / 1000 });
  };

  const submit = () => {
    const found: Record<string, string> = {};

    if (!draft.userId) found.userId = MSG.selectRequired('사용자');
    if (!draft.plantId) found.plantId = MSG.selectRequired('발전소');
    if (!draft.name.trim()) found.name = MSG.requiredField('설비 이름');
    if (!draft.inverterProductId) found.inverterProductId = MSG.selectRequired('인버터 모델');
    if (!draft.moduleProductId) found.moduleProductId = MSG.selectRequired('모듈 모델');

    if (draft.rtuPort !== '') {
      if (draft.rtuPort < PORT_MIN || draft.rtuPort > PORT_MAX) {
        found.rtuPort = MSG.numberRange('RTU 포트', PORT_MIN, PORT_MAX);
      } else if (draft.rtuPort === PYRANOMETER_PORT) {
        found.rtuPort = `${PYRANOMETER_PORT}번 포트는 일사량계 몫이라 쓸 수 없습니다.`;
      }
    }

    if (draft.azimuth === '' || draft.azimuth < AZIMUTH_MIN || draft.azimuth > AZIMUTH_MAX) {
      found.azimuth = MSG.numberRange('방위각', AZIMUTH_MIN, AZIMUTH_MAX);
    }

    if (draft.inclineAngle === '' || draft.inclineAngle < INCLINE_MIN || draft.inclineAngle > INCLINE_MAX) {
      found.inclineAngle = MSG.numberRange('경사각', INCLINE_MIN, INCLINE_MAX);
    }

    if (draft.series1 === '' || draft.series1 < ARRAY_MIN || draft.series1 > ARRAY_MAX) {
      found.series1 = MSG.numberRange('직렬 1', ARRAY_MIN, ARRAY_MAX);
    }

    if (draft.parallel1 === '' || draft.parallel1 < ARRAY_MIN || draft.parallel1 > ARRAY_MAX) {
      found.parallel1 = MSG.numberRange('병렬 1', ARRAY_MIN, ARRAY_MAX);
    }

    if (draft.equipmentCapacity === '' || draft.equipmentCapacity <= 0) {
      found.equipmentCapacity = MSG.requiredField('설비용량');
    }

    // 스트링 구조는 이 폼이 함께 저장하므로 여기서 함께 본다.
    if (hasStrings) Object.assign(found, validateStringRows(strings));

    setErrors(found);
    if (Object.keys(found).length === 0) setIsConfirming(true);
  };

  const commit = () => {
    const inverterId = target?.inverterId ?? nextId('EQP');
    const saved: EquipmentMaster = {
      inverterId,
      cid: target?.cid ?? CID_BASE + nextSeq(),
      plantId: draft.plantId,
      userId: draft.userId === '' ? null : Number(draft.userId),
      name: draft.name.trim(),
      rtuCommId: draft.rtuCommId.trim(),
      rtuPort: draft.rtuPort === '' ? null : Number(draft.rtuPort),
      inverterProductId: draft.inverterProductId,
      moduleProductId: draft.moduleProductId,
      azimuth: Number(draft.azimuth),
      inclineAngle: Number(draft.inclineAngle),
      series1: Number(draft.series1),
      parallel1: Number(draft.parallel1),
      series2: Number(draft.series2 || 0),
      parallel2: Number(draft.parallel2 || 0),
      equipmentCapacity: Number(draft.equipmentCapacity || 0),
      asExpiresAt: draft.asExpiresAt.trim(),
      note: draft.note.trim(),
      installedAt: draft.installedAt.trim(),
      // 운영일시는 운전시작일을 따라간다 — 손으로 고치는 값이 아니다.
      operatedAt: draft.operatedAt.trim() || draft.installedAt.trim(),
    };
    const logTarget = {
      kind: 'equipment' as const,
      id: saved.inverterId,
      name: saved.name,
      actor: actor?.name ?? '관리자',
    };

    const entries = isNew
      ? createdEntry(
        logTarget,
        `${plant?.plantName ?? ''} · ${inverter?.name ?? ''} · ${formatNumber(saved.equipmentCapacity, 1)}kW`,
      )
      : diffEntries(logTarget, [
        { label: '설비 이름', before: target?.name ?? '', after: saved.name },
        { label: '발전소', before: target?.plantName ?? '', after: plant?.plantName ?? '' },
        { label: '사용자', before: String(target?.userId ?? ''), after: String(saved.userId ?? '') },
        { label: '인버터 모델', before: target?.inverterName ?? '', after: inverter?.name ?? '' },
        { label: '모듈 모델', before: target?.moduleName ?? '', after: module?.name ?? '' },
        { label: 'RTU 통신 ID', before: target?.rtuCommId ?? '', after: saved.rtuCommId },
        { label: 'RTU 포트', before: String(target?.rtuPort ?? ''), after: String(saved.rtuPort ?? '') },
        { label: '방위각', before: `${target?.azimuth ?? ''}도`, after: `${saved.azimuth}도` },
        { label: '경사각', before: `${target?.inclineAngle ?? ''}도`, after: `${saved.inclineAngle}도` },
        {
          label: '모듈 구성',
          before: target ? `${target.series1}×${target.parallel1} / ${target.series2}×${target.parallel2}` : '',
          after: `${saved.series1}×${saved.parallel1} / ${saved.series2}×${saved.parallel2}`,
        },
        {
          label: '설비용량',
          before: target ? `${formatNumber(target.equipmentCapacity, 1)}kW` : '',
          after: `${formatNumber(saved.equipmentCapacity, 1)}kW`,
        },
        { label: 'AS 만료일', before: target?.asExpiresAt ?? '', after: saved.asExpiresAt },
        { label: '운전시작일', before: target?.installedAt ?? '', after: saved.installedAt },
        { label: '비고', before: target?.note ?? '', after: saved.note },
      ]);

    saveEquipment(saved, entries, isNew);

    /*
      스트링 구조는 따로 저장하지 않고 설비와 함께 나간다 (화면정의 「저장 시 API 호출 없이
      설비 폼으로 값 반환」). 편집판이 곧 이 설비의 전체 목록이라 뺀 줄은 함께 지워진다.
    */
    if (hasStrings) {
      const current = listOf(inverterId);
      const known = new Map(current.map((row) => [row.id, row.stringId]));
      const built: StringMaster[] = strings.map((row) => ({
        id: row.id ?? `str-${inverterId}-${Date.now().toString(36)}-${row.key}`,
        stringId: (row.id ? known.get(row.id) : undefined) ?? nextSeq() + row.key,
        inverterId,
        seq: Number(row.seq),
        name: row.name.trim(),
        seriesCount: Number(row.seriesCount),
        parallelCount: Number(row.parallelCount),
      }));
      const before = new Map(current.map((row) => [row.id, row]));
      const after = new Map(built.map((row) => [row.id, row]));

      saveStrings(inverterId, built, diffEntries(
        { kind: 'string', id: inverterId, name: saved.name, actor: actor?.name ?? '관리자' },
        [...new Set([...before.keys(), ...after.keys()])].map((id) => {
          const prev = before.get(id);
          const next = after.get(id);

          return {
            label: `순번 ${next?.seq ?? prev?.seq ?? 0} 스트링`,
            before: prev ? summarizeString(prev) : '',
            after: next ? summarizeString(next) : '',
          };
        }),
      ));
    }

    toast.success(isNew ? MSG.createSuccess('설비') : MSG.updateSuccess(saved.name));
    setIsConfirming(false);
    navigate(backTo);
  };

  return (
    <>
      <FormPage
        title={isNew ? '설비 등록' : '설비 수정'}
        description="설비용량은 고른 모듈 모델과 직병렬 구성에서 산출합니다."
        backTo={backTo}
        footer={(
          <>
            <Button variant="secondary" onClick={() => navigate(backTo)}>취소</Button>
            <Button onClick={submit}>저장</Button>
          </>
        )}
      >
        <FormSection legend="소속" hint="사용자를 먼저 고르면 그 사용자의 발전소만 추려 보여 줍니다.">
          <FormRow cols={2}>
            <PickerField
              label="사용자"
              value={user ? `${user.name} · ${user.orgName}` : ''}
              placeholder="사용자를 고르세요"
              onOpen={() => setPicker('user')}
              required
              error={errors.userId}
            />
            <PickerField
              label="발전소"
              value={plant?.plantName ?? ''}
              placeholder={draft.userId ? '발전소를 고르세요' : '사용자를 먼저 고르세요'}
              onOpen={() => setPicker('plant')}
              disabled={!draft.userId}
              required
              error={errors.plantId}
            />
          </FormRow>
          <FormRow cols={2}>
            <TextField
              label="설비 이름"
              value={draft.name}
              onChange={(value) => change({ name: value })}
              maxLength={120}
              required
              error={errors.name}
            />
            <TextField
              label="운전시작일"
              value={draft.installedAt}
              onChange={(value) => change({ installedAt: value })}
              ime="numeric"
              hint="YYYY-MM-DD"
              optional
            />
          </FormRow>
        </FormSection>

        <FormSection legend="통신" hint={`${PYRANOMETER_PORT}번 포트는 일사량계가 씁니다.`}>
          <FormRow cols={2}>
            <TextField
              label="RTU 통신 ID"
              value={draft.rtuCommId}
              onChange={(value) => change({ rtuCommId: value })}
              ime="latin"
              maxLength={255}
              optional
              error={errors.rtuCommId}
            />
            <NumberField
              label="RTU 통신 포트"
              value={draft.rtuPort}
              onChange={(value) => change({ rtuPort: value })}
              min={PORT_MIN}
              max={PORT_MAX}
              optional
              error={errors.rtuPort}
            />
          </FormRow>
        </FormSection>

        <FormSection legend="설치 제원" hint="정남이 180도입니다.">
          <FormRow cols={2}>
            <NumberField
              label="방위각"
              value={draft.azimuth}
              onChange={(value) => change({ azimuth: value })}
              min={AZIMUTH_MIN}
              max={AZIMUTH_MAX}
              unit="도"
              placeholder={`${AZIMUTH_MIN} ~ ${AZIMUTH_MAX}`}
              required
              error={errors.azimuth}
            />
            <NumberField
              label="경사각"
              value={draft.inclineAngle}
              onChange={(value) => change({ inclineAngle: value })}
              min={INCLINE_MIN}
              max={INCLINE_MAX}
              unit="도"
              placeholder={`${INCLINE_MIN} ~ ${INCLINE_MAX}`}
              required
              error={errors.inclineAngle}
            />
          </FormRow>
        </FormSection>

        <FormSection legend="모델" hint="업체명으로도 찾을 수 있습니다.">
          <FormRow cols={2}>
            <PickerField
              label="인버터 모델"
              value={describeInverterProduct(inverter)}
              placeholder="인버터 모델을 고르세요"
              onOpen={() => setPicker('inverter')}
              required
              hint={inverter ? `${INVERTER_KIND_LABEL[inverter.kind]} · ${inverter.phase}` : undefined}
              error={errors.inverterProductId}
            />
            <PickerField
              label="모듈 모델"
              value={module ? `${module.maker} - ${module.name} (${module.moduleId})` : ''}
              placeholder="모듈 모델을 고르세요"
              onOpen={() => setPicker('module')}
              required
              hint={module ? `모듈 1장 ${formatNumber(module.wattPerPanel)}W` : undefined}
              error={errors.moduleProductId}
            />
          </FormRow>
        </FormSection>

        <FormSection legend="모듈 구성" hint="MPPT 2번을 쓰지 않으면 0으로 둡니다.">
          <FormRow cols={2}>
            <NumberField
              label="모듈 직렬 개수"
              value={draft.series1}
              onChange={(value) => changeArray({ series1: value })}
              min={ARRAY_MIN}
              max={ARRAY_MAX}
              unit="개"
              placeholder={`${ARRAY_MIN} ~ ${ARRAY_MAX}`}
              required
              error={errors.series1}
            />
            <NumberField
              label="모듈 병렬 개수"
              value={draft.parallel1}
              onChange={(value) => changeArray({ parallel1: value })}
              min={ARRAY_MIN}
              max={ARRAY_MAX}
              unit="개"
              placeholder={`${ARRAY_MIN} ~ ${ARRAY_MAX}`}
              required
              error={errors.parallel1}
            />
          </FormRow>
          <FormRow cols={2}>
            <NumberField
              label="모듈 직렬 2번 개수"
              value={draft.series2}
              onChange={(value) => changeArray({ series2: value })}
              min={ARRAY_MIN}
              max={ARRAY_MAX}
              unit="개"
              optional
            />
            <NumberField
              label="모듈 병렬 2번 개수"
              value={draft.parallel2}
              onChange={(value) => changeArray({ parallel2: value })}
              min={ARRAY_MIN}
              max={ARRAY_MAX}
              unit="개"
              optional
            />
          </FormRow>

          <FormRow cols={2}>
            <NumberField
              label="설비 용량"
              value={draft.equipmentCapacity}
              onChange={(value) => change({ equipmentCapacity: value })}
              min={0}
              step={0.001}
              unit="kW"
              required
              hint="모듈 출력 × (직렬 × 병렬)로 채워집니다"
              error={errors.equipmentCapacity}
            />
          </FormRow>

          {hasStrings ? (
            <div className={styles.stringFoot}>
              <p className={styles.toolbar__note}>
                스트링 인버터라 스트링 구조를 함께 등록합니다 — 지금 {formatNumber(strings.length)}조
              </p>
              <Button variant="secondary" onClick={() => setPicker('strings')}>스트링 구조</Button>
            </div>
          ) : null}
        </FormSection>

        <FormSection legend="비고">
          <TextArea
            label="메모"
            value={draft.note}
            onChange={(value) => change({ note: value })}
            optional
            placeholder="교체 예정이나 점검 시 주의할 점을 적어 두세요."
          />
        </FormSection>

        <details className={styles.more}>
          <summary className={styles.more__summary}>더보기</summary>
          <div className={styles.more__body}>
            <TextField
              label="AS 만료일"
              value={draft.asExpiresAt}
              onChange={(value) => change({ asExpiresAt: value })}
              ime="numeric"
              hint="YYYY-MM-DD · 기본값은 오늘로부터 5년"
              width="md"
            />
            <dl className={styles.infoGrid}>
              <div>
                <dt>사용자 ID</dt>
                <dd>{draft.userId || '—'}</dd>
              </div>
              <div>
                <dt>RTU 업체</dt>
                <dd>{plant?.rtuEntName || '—'}</dd>
              </div>
              <div>
                <dt>모듈당 용량</dt>
                <dd>{module ? `${formatNumber(module.wattPerPanel)} W` : '—'}</dd>
              </div>
              <div>
                <dt>인버터 용량</dt>
                <dd>{inverter ? `${formatNumber(inverter.capacityKw, 1)} kW` : '—'}</dd>
              </div>
              <div>
                <dt>시공 업체</dt>
                <dd>{plant?.builder.name || '—'}</dd>
              </div>
              <div>
                <dt>CID</dt>
                <dd>{target?.cid ?? '저장하면 매겨집니다'}</dd>
              </div>
              <div>
                <dt>최초 수신일자</dt>
                <dd>{target?.installedAt || '—'}</dd>
              </div>
              <div>
                <dt>최종 수신일자</dt>
                <dd>{target?.operatedAt || '—'}</dd>
              </div>
              <div>
                <dt>특이사항</dt>
                <dd>{draft.note || '—'}</dd>
              </div>
            </dl>
          </div>
        </details>
      </FormPage>

      <Modal
        isOpen={picker === 'user'}
        onClose={() => setPicker(null)}
        size="lg"
        title="사용자 검색"
        description="사용자 관리에 등록된 계정입니다."
      >
        <RecordPicker
          rows={users}
          getRowKey={(row) => String(row.userId)}
          selectedKey={draft.userId}
          caption="사용자 목록. ID, 사용자, 소속, 이메일 순입니다."
          placeholder="이름·소속·이메일로 검색"
          match={(row, word) => row.name.includes(word)
              || row.orgName.includes(word)
              || row.email.includes(word)
              || String(row.userId).includes(word)}
          columns={[
            { key: 'userId', header: 'ID', width: '80px', render: (row) => row.userId },
            { key: 'name', header: '사용자', width: '120px', render: (row) => row.name },
            { key: 'org', header: '소속', render: (row) => row.orgName },
            { key: 'email', header: '이메일', width: '200px', hideOnTablet: true, render: (row) => row.email },
          ]}
          onPick={(row) => {
            // 사용자를 바꾸면 앞서 고른 발전소는 그 사람 것이 아닐 수 있어 비운다.
            const picked = String(row.userId);

            setDraft({
              ...draft,
              userId: picked,
              plantId: picked === draft.userId ? draft.plantId : '',
            });
            setPicker(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={picker === 'plant'}
        onClose={() => setPicker(null)}
        size="lg"
        title="발전소 검색"
        description="고른 사용자에게 매인 발전소만 보여 줍니다."
      >
        <RecordPicker
          rows={plants.filter((item) => String(item.userId) === draft.userId)}
          getRowKey={(row) => row.plantId}
          selectedKey={draft.plantId}
          caption="발전소 목록. ID, 발전소 이름, 주소 순입니다."
          placeholder="발전소 이름·ID·주소로 검색"
          emptyTitle="이 사용자에게 매인 발전소가 없습니다"
          match={(row, word) => row.plantName.includes(word)
              || row.address.includes(word)
              || String(row.powerPlantId).includes(word)}
          columns={[
            { key: 'id', header: 'ID', width: '90px', render: (row) => row.powerPlantId },
            { key: 'name', header: '발전소 이름', width: '200px', render: (row) => row.plantName },
            { key: 'address', header: '주소', render: (row) => `${row.address} ${row.addressDetail}`.trim() },
          ]}
          onPick={(row) => {
            change({ plantId: row.plantId });
            setPicker(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={picker === 'inverter'}
        onClose={() => setPicker(null)}
        size="lg"
        title="인버터 모델 검색"
        description="시스템장비 관리에 등록된 제품입니다. 업체명으로도 찾을 수 있습니다."
      >
        <RecordPicker
          rows={inverters}
          getRowKey={(row) => row.id}
          selectedKey={draft.inverterProductId}
          caption="인버터 제품 목록. ID, 업체, 모델, 용량, 타입 순입니다."
          placeholder="모델명·업체명으로 검색"
          match={(row, word) => row.name.includes(word)
              || row.maker.includes(word)
              || String(row.inverterId).includes(word)}
          columns={[
            { key: 'id', header: 'ID', width: '80px', render: (row) => row.inverterId },
            { key: 'maker', header: '업체', width: '130px', render: (row) => row.maker },
            { key: 'name', header: '모델', render: (row) => row.name },
            {
              key: 'capacity',
              header: '용량',
              width: '90px',
              align: 'right',
              render: (row) => `${formatNumber(row.capacityKw, 1)}kW`,
            },
            {
              key: 'kind',
              header: '타입',
              width: '110px',
              hideOnTablet: true,
              render: (row) => `${INVERTER_KIND_LABEL[row.kind]} · ${row.phase}`,
            },
          ]}
          onPick={(row) => {
            change({ inverterProductId: row.id });
            setPicker(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={picker === 'module'}
        onClose={() => setPicker(null)}
        size="lg"
        title="모듈 모델 검색"
        description="시스템장비 관리에 등록된 제품입니다. 업체명으로도 찾을 수 있습니다."
      >
        <RecordPicker
          rows={modules}
          getRowKey={(row) => row.id}
          selectedKey={draft.moduleProductId}
          caption="모듈 제품 목록. ID, 업체, 모델, 용량 순입니다."
          placeholder="모델명·업체명으로 검색"
          match={(row, word) => row.name.includes(word)
              || row.maker.includes(word)
              || String(row.moduleId).includes(word)}
          columns={[
            { key: 'id', header: 'ID', width: '80px', render: (row) => row.moduleId },
            { key: 'maker', header: '업체', width: '130px', render: (row) => row.maker },
            { key: 'name', header: '모델', render: (row) => row.name },
            {
              key: 'watt',
              header: '용량',
              width: '90px',
              align: 'right',
              render: (row) => `${formatNumber(row.wattPerPanel)}W`,
            },
          ]}
          onPick={(row) => {
            changeArray({ moduleProductId: row.id });
            setPicker(null);
          }}
        />
      </Modal>

      <Modal
        isOpen={picker === 'strings'}
        onClose={() => setPicker(null)}
        size="lg"
        title="스트링 구조"
        description="여기서 고친 스트링은 설비를 저장할 때 함께 저장됩니다."
        footer={<Button variant="secondary" onClick={() => setPicker(null)}>설비 폼으로</Button>}
      >
        <StringRows
          rows={strings}
          onChange={setStrings}
          errors={errors}
          legend="스트링 구성"
          emptyNote="아래 버튼으로 이 설비의 스트링을 추가해 주세요."
        />
      </Modal>

      <ConfirmDialog
        isOpen={isConfirming}
        title={isNew ? MSG.createConfirm('설비') : MSG.updateConfirm(draft.name)}
        description={draft.equipmentCapacity === ''
          ? undefined
          : `설비용량은 ${formatNumber(Number(draft.equipmentCapacity), 1)}kW 로 저장됩니다.`}
        confirmLabel="저장"
        onConfirm={commit}
        onClose={() => setIsConfirming(false)}
      />
    </>
  );
}
