import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/common/Button';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { createdEntry, deletedEntry, diffEntries } from '@/pages/Admin/_shared/changeLog';
import { createForm, FormRow, FormSection } from '@/components/common/Form';
import { describeInverterProduct, INVERTER_KIND_LABEL } from '@/mocks/deviceMaster';
import {
  ARRAY_MAX,
  ARRAY_MIN,
  AZIMUTH_MAX,
  AZIMUTH_MIN,
  equipmentFormSchema,
  INCLINE_MAX,
  INCLINE_MIN,
  PORT_MAX,
  PORT_MIN,
} from '@/service/equipment/type';
import { formatNumber } from '@/utils/format';
import { FormPage } from '@/pages/Admin/_shared/FormPage';
import { listPath } from '@/pages/Admin/_shared/adminPath';
import { Modal } from '@/components/common/Modal';
import { MSG } from '@/configs/messages';
import { PYRANOMETER_PORT } from '@/mocks/pyranometers';
import { RecordPicker } from '@/components/common/RecordPicker';
import { StringRows } from '@/pages/Admin/Plants/String/components/StringRows';
import { summarizeString, useStringsOf } from '@/pages/Admin/Plants/String/hooks/useStringData';
import { toast } from '@/stores/toastStore';
import { useAuthUser } from '@/stores/authStore';
import { useInverterProducts } from '@/pages/Admin/_shared/device/useSelectableEquipment';
import { useManagedUsers, usePlantAssets } from '@/hooks/usePlantAssets';
import useEquipmentStore from '@/stores/equipmentStore';
import type { EquipmentFormValues } from '@/service/equipment/type';
import type { EquipmentMaster, StringMaster } from '@/interface/deviceMaster';
import styles from '@/pages/Admin/Admin.module.scss';
import { useDerivedCapacity } from '../hooks/useDerivedCapacity';
import { useEquipmentRows, useModuleProducts } from '../hooks/useEquipmentRows';
import { EMPTY_VALUES, moduleLabelOf, toFormValues, userLabelOf } from './values';

/** CID 는 기존 체계를 따라 이 값에 일련번호를 더해 만든다 */
const CID_BASE = 10192000000;

const Form = createForm<EquipmentFormValues>();

interface EquipmentEditorProps {
  /** 고칠 설비의 서버 식별자. 없으면 새로 세우는 자리다 */
  cid: number | null;
}

/** 설비 등록·수정 (SFR-016-01~04, SFR-017-04) */
export function EquipmentEditor({ cid }: EquipmentEditorProps) {
  const rows = useEquipmentRows();
  const navigate = useNavigate();
  const saveEquipment = useEquipmentStore((state) => state.saveEquipment);
  const removeEquipment = useEquipmentStore((state) => state.removeEquipment);
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

  const methods = useForm<EquipmentFormValues>({
    defaultValues: target
      ? toFormValues(target, { users, plants, inverters, modules, strings: listOf(target.inverterId) })
      : EMPTY_VALUES,
    resolver: zodResolver(equipmentFormSchema),
    mode: 'onChange',
  });

  useDerivedCapacity(methods, modules);

  const [pending, setPending] = useState<EquipmentFormValues | null>(null);
  const [isStringOpen, setIsStringOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const userId = useWatch({ control: methods.control, name: 'userId' });
  const plantId = useWatch({ control: methods.control, name: 'plantId' });
  const inverterProductId = useWatch({ control: methods.control, name: 'inverterProductId' });
  const moduleProductId = useWatch({ control: methods.control, name: 'moduleProductId' });
  const inverterKind = useWatch({ control: methods.control, name: 'inverterKind' });
  const stringRows = useWatch({ control: methods.control, name: 'rows' });
  const note = useWatch({ control: methods.control, name: 'note' });

  const module = modules.find((item) => item.id === moduleProductId);
  const inverter = inverters.find((item) => item.id === inverterProductId);
  const plant = plants.find((item) => item.plantId === plantId);
  // 스트링 구조는 스트링 기종에만 있다.
  const hasStrings = inverterKind === 'string';
  const rowsError = methods.getFieldState('rows', methods.formState).error;

  const commit = (values: EquipmentFormValues) => {
    const inverterId = target?.inverterId ?? nextId('EQP');
    const saved: EquipmentMaster = {
      inverterId,
      cid: target?.cid ?? CID_BASE + nextSeq(),
      plantId: values.plantId,
      userId: values.userId === '' ? null : Number(values.userId),
      name: values.name,
      rtuCommId: values.rtuCommId,
      rtuPort: values.rtuPort,
      inverterProductId: values.inverterProductId,
      moduleProductId: values.moduleProductId,
      azimuth: values.azimuth,
      inclineAngle: values.inclineAngle,
      series1: values.series1,
      parallel1: values.parallel1,
      series2: values.series2,
      parallel2: values.parallel2,
      equipmentCapacity: values.equipmentCapacity,
      asExpiresAt: values.asExpiresAt.trim(),
      note: values.note.trim(),
      installedAt: values.installedAt.trim(),
      // 운영일시는 설치일시를 따라간다 — 손으로 고치는 값이 아니다.
      operatedAt: values.operatedAt.trim() || values.installedAt.trim(),
      // 수집기가 채우는 값이라 등록·수정에서 만들지 않는다.
      firstReceivedAt: target?.firstReceivedAt ?? null,
      lastReceivedAt: target?.lastReceivedAt ?? null,
    };
    const logTarget = {
      targetType: 'equipment' as const,
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
        { label: '설치일시', before: target?.installedAt ?? '', after: saved.installedAt },
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
      const built: StringMaster[] = values.rows.map((row, index) => ({
        id: row.id ?? `str-${inverterId}-${Date.now().toString(36)}-${index + 1}`,
        stringId: (row.id ? known.get(row.id) : undefined) ?? nextSeq() + index + 1,
        inverterId,
        seq: row.seq,
        name: row.name,
        seriesCount: row.seriesCount,
        parallelCount: row.parallelCount,
      }));
      const before = new Map(current.map((row) => [row.id, row]));
      const after = new Map(built.map((row) => [row.id, row]));

      saveStrings(inverterId, built, diffEntries(
        { targetType: 'string', id: inverterId, name: saved.name, actor: actor?.name ?? '관리자' },
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
    navigate(backTo);
  };

  const remove = () => {
    if (!target) return;

    removeEquipment(target.inverterId, deletedEntry(
      { targetType: 'equipment', id: target.inverterId, name: target.name, actor: actor?.name ?? '관리자' },
      `${target.plantName} · ${formatNumber(target.equipmentCapacity, 1)}kW`,
    ));
    toast.success(MSG.deleteSuccess(target.name));
    navigate(backTo);
  };

  return (
    <>
      <Form methods={methods} onSubmit={setPending}>
        <FormPage
          title={isNew ? '설비 등록' : '설비 수정'}
          description="설비용량은 고른 모듈 모델과 직병렬 구성에서 산출합니다."
          backTo={backTo}
          danger={isNew ? null : <Button variant="solar" onClick={() => setIsDeleting(true)}>삭제</Button>}
          footer={(
            <>
              <Button variant="secondary" onClick={() => navigate(backTo)}>취소</Button>
              <Form.Submit />
            </>
          )}
        >
          <FormSection legend="소속" hint="사용자를 먼저 고르면 그 사용자의 발전소만 추려 보여 줍니다.">
            <FormRow cols={2}>
              <Form.Picker
                label="사용자"
                name="userId"
                displayName="userLabel"
                placeholder="사용자를 고르세요"
                required
                modal={({ onSelect, onClose }) => (
                  <Modal
                    isOpen
                    onClose={onClose}
                    size="lg"
                    title="사용자 검색"
                    description="사용자 관리에 등록된 계정입니다."
                  >
                    <RecordPicker
                      rows={users}
                      getRowKey={(row) => String(row.userId)}
                      selectedKey={userId}
                      caption="사용자 목록. ID, 사용자, 로그인 ID, 이메일 순입니다."
                      placeholder="이름·로그인 ID·이메일로 검색"
                      match={(row, word) => row.name.includes(word)
                        || row.loginId.includes(word)
                        || row.email.includes(word)
                        || String(row.userId).includes(word)}
                      columns={[
                        { key: 'userId', header: 'ID', width: '80px', render: (row) => row.userId },
                        { key: 'name', header: '사용자', width: '120px', render: (row) => row.name },
                        { key: 'loginId', header: '로그인 ID', render: (row) => row.loginId },
                        {
                          key: 'email',
                          header: '이메일',
                          width: '200px',
                          hideOnTablet: true,
                          render: (row) => row.email,
                        },
                      ]}
                      // 사용자를 바꾸면 앞서 고른 발전소는 그 사람 것이 아닐 수 있어 비운다.
                      onPick={(row) => onSelect(String(row.userId) === userId
                        ? { userId, userLabel: userLabelOf(row) }
                        : { userId: String(row.userId), userLabel: userLabelOf(row), plantId: '', plantLabel: '' })}
                    />
                  </Modal>
                )}
              />
              <Form.Picker
                label="발전소"
                name="plantId"
                displayName="plantLabel"
                placeholder={userId ? '발전소를 고르세요' : '사용자를 먼저 고르세요'}
                disabled={!userId}
                required
                modal={({ onSelect, onClose }) => (
                  <Modal
                    isOpen
                    onClose={onClose}
                    size="lg"
                    title="발전소 검색"
                    description="고른 사용자에게 매인 발전소만 보여 줍니다."
                  >
                    <RecordPicker
                      rows={plants.filter((item) => String(item.userId) === userId)}
                      getRowKey={(row) => row.plantId}
                      selectedKey={plantId}
                      caption="발전소 목록. ID, 발전소 이름, 주소 순입니다."
                      placeholder="발전소 이름·ID·주소로 검색"
                      emptyTitle="이 사용자에게 매인 발전소가 없습니다"
                      match={(row, word) => row.plantName.includes(word)
                        || row.address.includes(word)
                        || String(row.powerPlantId).includes(word)}
                      columns={[
                        { key: 'id', header: 'ID', width: '90px', render: (row) => row.powerPlantId },
                        { key: 'name', header: '발전소 이름', width: '200px', render: (row) => row.plantName },
                        {
                          key: 'address',
                          header: '주소',
                          render: (row) => `${row.address} ${row.addressDetail}`.trim(),
                        },
                      ]}
                      onPick={(row) => onSelect({ plantId: row.plantId, plantLabel: row.plantName })}
                    />
                  </Modal>
                )}
              />
            </FormRow>
            <FormRow cols={2}>
              <Form.Text label="설비 이름" name="name" maxLength={120} required />
              <Form.Date label="설치일시" name="installedAt" placeholder="설치한 날" />
            </FormRow>
          </FormSection>

          <FormSection legend="통신" hint={`${PYRANOMETER_PORT}번 포트는 일사량계가 씁니다.`}>
            <FormRow cols={2}>
              <Form.Text label="RTU 통신 ID" name="rtuCommId" ime="latin" maxLength={255} optional />
              <Form.Number
                label="RTU 통신 포트"
                name="rtuPort"
                emptyValue={null}
                min={PORT_MIN}
                max={PORT_MAX}
                optional
              />
            </FormRow>
          </FormSection>

          <FormSection legend="설치 제원" hint="정남이 180도입니다.">
            <FormRow cols={2}>
              <Form.Number
                label="방위각"
                name="azimuth"
                min={AZIMUTH_MIN}
                max={AZIMUTH_MAX}
                unit="도"
                placeholder={`${AZIMUTH_MIN} ~ ${AZIMUTH_MAX}`}
                required
              />
              <Form.Number
                label="경사각"
                name="inclineAngle"
                min={INCLINE_MIN}
                max={INCLINE_MAX}
                unit="도"
                placeholder={`${INCLINE_MIN} ~ ${INCLINE_MAX}`}
                required
              />
            </FormRow>
          </FormSection>

          <FormSection legend="모델" hint="업체명으로도 찾을 수 있습니다.">
            <FormRow cols={2}>
              <Form.Picker
                label="인버터 모델"
                name="inverterProductId"
                displayName="inverterLabel"
                placeholder="인버터 모델을 고르세요"
                required
                hint={inverter ? `${INVERTER_KIND_LABEL[inverter.kind]} · ${inverter.phase}` : undefined}
                modal={({ onSelect, onClose }) => (
                  <Modal
                    isOpen
                    onClose={onClose}
                    size="lg"
                    title="인버터 모델 검색"
                    description="시스템장비 관리에 등록된 제품입니다. 업체명으로도 찾을 수 있습니다."
                  >
                    <RecordPicker
                      rows={inverters}
                      getRowKey={(row) => row.id}
                      selectedKey={inverterProductId}
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
                      // 타입이 스트링인지에 따라 스트링 줄을 요구할지가 갈린다 — 함께 담아 둔다.
                      onPick={(row) => onSelect({
                        inverterProductId: row.id,
                        inverterLabel: describeInverterProduct(row),
                        inverterKind: row.kind,
                      })}
                    />
                  </Modal>
                )}
              />
              <Form.Picker
                label="모듈 모델"
                name="moduleProductId"
                displayName="moduleLabel"
                placeholder="모듈 모델을 고르세요"
                required
                hint={module ? `모듈 1장 ${formatNumber(module.wattPerPanel)}W` : undefined}
                modal={({ onSelect, onClose }) => (
                  <Modal
                    isOpen
                    onClose={onClose}
                    size="lg"
                    title="모듈 모델 검색"
                    description="시스템장비 관리에 등록된 제품입니다. 업체명으로도 찾을 수 있습니다."
                  >
                    <RecordPicker
                      rows={modules}
                      getRowKey={(row) => row.id}
                      selectedKey={moduleProductId}
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
                      onPick={(row) => onSelect({ moduleProductId: row.id, moduleLabel: moduleLabelOf(row) })}
                    />
                  </Modal>
                )}
              />
            </FormRow>
          </FormSection>

          <FormSection legend="모듈 구성" hint="MPPT 2번을 쓰지 않으면 0으로 둡니다.">
            <FormRow cols={2}>
              <Form.Number
                label="모듈 직렬 개수"
                name="series1"
                min={ARRAY_MIN}
                max={ARRAY_MAX}
                unit="개"
                placeholder={`${ARRAY_MIN} ~ ${ARRAY_MAX}`}
                required
              />
              <Form.Number
                label="모듈 병렬 개수"
                name="parallel1"
                min={ARRAY_MIN}
                max={ARRAY_MAX}
                unit="개"
                placeholder={`${ARRAY_MIN} ~ ${ARRAY_MAX}`}
                required
              />
            </FormRow>
            <FormRow cols={2}>
              {/* MPPT 2번을 안 쓰면 비우는 게 자연스럽다 — 비운 칸은 0 으로 읽는다. */}
              <Form.Number
                label="모듈 직렬 2번 개수"
                name="series2"
                emptyValue={0}
                min={ARRAY_MIN}
                max={ARRAY_MAX}
                unit="개"
                optional
              />
              <Form.Number
                label="모듈 병렬 2번 개수"
                name="parallel2"
                emptyValue={0}
                min={ARRAY_MIN}
                max={ARRAY_MAX}
                unit="개"
                optional
              />
            </FormRow>

            <FormRow cols={2}>
              <Form.Number
                label="설비 용량"
                name="equipmentCapacity"
                min={0}
                step={0.001}
                unit="kW"
                required
                hint="모듈 출력 × (직렬 × 병렬)로 채워집니다"
              />
            </FormRow>

            {hasStrings ? (
              <div className={styles.rowFoot}>
                <p className={styles.toolbar__note}>
                  {rowsError?.message
                    ?? `스트링 인버터라 스트링 구조를 함께 등록합니다 — 지금 ${formatNumber(stringRows.length)}조`}
                </p>
                <Button variant="secondary" onClick={() => setIsStringOpen(true)}>스트링 구조</Button>
              </div>
            ) : null}
          </FormSection>

          <FormSection legend="비고">
            <Form.Area label="메모" name="note" optional placeholder="교체 예정이나 점검 시 주의할 점을 적어 두세요." />
          </FormSection>

          <details className={styles.more}>
            <summary className={styles.more__summary}>더보기</summary>
            <div className={styles.more__body}>
              <Form.Text
                label="AS 만료일"
                name="asExpiresAt"
                ime="numeric"
                hint="YYYY-MM-DD · 기본값은 오늘로부터 5년"
                width="md"
              />
              <dl className={styles.infoGrid}>
                <div>
                  <dt>사용자 ID</dt>
                  <dd>{userId || '—'}</dd>
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
                  <dd>{target?.firstReceivedAt || '—'}</dd>
                </div>
                <div>
                  <dt>최종 수신일자</dt>
                  <dd>{target?.lastReceivedAt || '—'}</dd>
                </div>
                <div>
                  <dt>특이사항</dt>
                  <dd>{note || '—'}</dd>
                </div>
              </dl>
            </div>
          </details>
        </FormPage>

        <Modal
          isOpen={isStringOpen}
          onClose={() => setIsStringOpen(false)}
          size="lg"
          title="스트링 구조"
          description="여기서 고친 스트링은 설비를 저장할 때 함께 저장됩니다."
          footer={<Button variant="secondary" onClick={() => setIsStringOpen(false)}>설비 폼으로</Button>}
        >
          <StringRows
            legend="스트링 구성"
            emptyNote="아래 버튼으로 이 설비의 스트링을 추가해 주세요."
          />
        </Modal>
      </Form>

      <ConfirmDialog
        isOpen={pending !== null}
        title={isNew ? MSG.createConfirm('설비') : MSG.updateConfirm(pending?.name ?? '설비')}
        description={pending
          ? `설비용량은 ${formatNumber(pending.equipmentCapacity, 1)}kW 로 저장됩니다.`
          : undefined}
        confirmLabel="저장"
        onConfirm={() => pending && commit(pending)}
        onClose={() => setPending(null)}
      />

      <ConfirmDialog
        isOpen={isDeleting}
        title={MSG.deleteConfirm(target?.name ?? '설비')}
        description="이 설비에 딸린 스트링 등록 정보는 남습니다. 스트링 탭에서 따로 정리해 주세요."
        confirmLabel="삭제"
        tone="danger"
        onConfirm={remove}
        onClose={() => setIsDeleting(false)}
      />
    </>
  );
}
