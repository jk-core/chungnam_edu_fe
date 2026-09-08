import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useMemo } from 'react';
import type {
  EquipmentMaster,
  InverterProduct,
  ModuleProduct,
  Pyranometer,
  StringMaster,
} from '@/interface/deviceMaster';
import type { ChangeLog, ChangeTarget } from '@/interface/changeLog';
import { SEED_DEVICE_CHANGES, SEED_EQUIPMENT, SEED_INVERTER_PRODUCTS, SEED_STRINGS } from '@/mocks/deviceMaster';
import { SEED_MODULES } from '@/mocks/moduleProducts';
import { SEED_PYRANOMETERS } from '@/mocks/pyranometers';

/**
 * 시스템장비 관리의 쓰기 상태 (SFR-016-01/05, SFR-017).
 *
 * 발전소·사용자를 다루는 `assetStore` 와 같은 방식이다 — 시드는 mocks 가 갖고 여기는 변경분만
 * 얹는다. 갈래마다 등록·수정·삭제 셋을 갖는데, 한 스토어에 몰아 두면 `assetStore` 처럼
 * 넓어지므로 장비 몫만 따로 세운다.
 */
interface EquipmentState {
  /** 발전소에 실제로 선 설비 (meain) */
  equipmentCreated: EquipmentMaster[];
  equipmentPatched: Record<string, Partial<EquipmentMaster>>;
  equipmentDeleted: string[];

  /** 인버터 제품 카탈로그 — 설비가 이 중 하나를 가리킨다 */
  inverterCreated: InverterProduct[];
  inverterPatched: Record<string, Partial<InverterProduct>>;
  inverterDeleted: string[];

  moduleCreated: ModuleProduct[];
  modulePatched: Record<string, Partial<ModuleProduct>>;
  moduleDeleted: string[];

  stringCreated: StringMaster[];
  stringPatched: Record<string, Partial<StringMaster>>;
  stringDeleted: string[];

  pyranometerCreated: Pyranometer[];
  pyranometerPatched: Record<string, Partial<Pyranometer>>;
  pyranometerDeleted: string[];

  /** 갈래가 함께 쓰는 변경 이력 (SFR-016-06) */
  deviceChanges: ChangeLog[];

  saveEquipment: (item: EquipmentMaster, entries: ChangeLog[], isNew: boolean) => void;
  removeEquipment: (id: string, entry: ChangeLog) => void;

  saveInverter: (item: InverterProduct, entries: ChangeLog[], isNew: boolean) => void;
  removeInverter: (id: string, entry: ChangeLog) => void;

  saveModule: (item: ModuleProduct, entries: ChangeLog[], isNew: boolean) => void;
  removeModule: (id: string, entry: ChangeLog) => void;

  /** 스트링은 인버터 단위로 한꺼번에 저장한다 */
  saveStrings: (inverterId: string, list: StringMaster[], entries: ChangeLog[]) => void;
  removeString: (id: string, entry: ChangeLog) => void;

  savePyranometer: (item: Pyranometer, entries: ChangeLog[], isNew: boolean) => void;
  removePyranometer: (id: string, entry: ChangeLog) => void;

  nextId: (prefix: string) => string;
  /** 서버가 새로 매길 숫자 번호를 흉내 낸다 (cid·moduleId·inverterId·stringId·irradId) */
  nextSeq: () => number;
}

/** 등록·수정을 한 갈래로 처리한다 — 새 항목이면 목록에, 아니면 변경분에 얹는다. */
function upsert<T>(
  created: T[],
  patched: Record<string, Partial<T>>,
  item: T,
  keyOf: (row: T) => string,
  isNew: boolean,
): { created: T[]; patched: Record<string, Partial<T>> } {
  if (isNew) return { created: [item, ...created], patched };

  // 새로 등록한 항목을 다시 고친 것이면 목록 쪽을 갈아 끼운다.
  if (created.some((row) => keyOf(row) === keyOf(item))) {
    return { created: created.map((row) => (keyOf(row) === keyOf(item) ? item : row)), patched };
  }

  return { created, patched: { ...patched, [keyOf(item)]: item } };
}

const useEquipmentStore = create<EquipmentState>()(
  persist(
    (set, get) => ({
      equipmentCreated: [],
      equipmentPatched: {},
      equipmentDeleted: [],
      inverterCreated: [],
      inverterPatched: {},
      inverterDeleted: [],
      moduleCreated: [],
      modulePatched: {},
      moduleDeleted: [],
      stringCreated: [],
      stringPatched: {},
      stringDeleted: [],
      pyranometerCreated: [],
      pyranometerPatched: {},
      pyranometerDeleted: [],
      deviceChanges: [],

      saveEquipment: (item, entries, isNew) =>
        set((state) => {
          const next = upsert(state.equipmentCreated, state.equipmentPatched, item, (row) => row.inverterId, isNew);

          return {
            equipmentCreated: next.created,
            equipmentPatched: next.patched,
            deviceChanges: [...entries, ...state.deviceChanges],
          };
        }),
      removeEquipment: (id, entry) =>
        set((state) => ({
          equipmentDeleted: [...state.equipmentDeleted, id],
          deviceChanges: [entry, ...state.deviceChanges],
        })),

      saveInverter: (item, entries, isNew) =>
        set((state) => {
          const next = upsert(state.inverterCreated, state.inverterPatched, item, (row) => row.id, isNew);

          return {
            inverterCreated: next.created,
            inverterPatched: next.patched,
            deviceChanges: [...entries, ...state.deviceChanges],
          };
        }),
      removeInverter: (id, entry) =>
        set((state) => ({
          inverterDeleted: [...state.inverterDeleted, id],
          deviceChanges: [entry, ...state.deviceChanges],
        })),

      saveModule: (item, entries, isNew) =>
        set((state) => {
          const next = upsert(state.moduleCreated, state.modulePatched, item, (row) => row.id, isNew);

          return {
            moduleCreated: next.created,
            modulePatched: next.patched,
            deviceChanges: [...entries, ...state.deviceChanges],
          };
        }),
      removeModule: (id, entry) =>
        set((state) => ({
          moduleDeleted: [...state.moduleDeleted, id],
          deviceChanges: [entry, ...state.deviceChanges],
        })),

      /*
        스트링은 칩을 늘렸다 줄였다 하며 한 판을 통째로 고치는 자리라 줄 단위로 나눠 저장하지
        않는다. 지금 인버터의 스트링을 전부 새 목록으로 갈아 끼우고, 사라진 줄은 삭제로 남긴다.
      */
      saveStrings: (inverterId, list, entries) =>
        set((state) => {
          const keep = state.stringCreated.filter((row) => row.inverterId !== inverterId);
          const keepIds = new Set(list.map((row) => row.id));
          /*
            목록에서 빠진 시드 줄은 삭제로 남겨야 한다. 저장분이 하나도 없는 인버터는
            `mergeStrings` 가 시드를 그대로 내보내므로, 전부 지운 경우 되살아난다.
          */
          const dropped = SEED_STRINGS
            .filter((row) => row.inverterId === inverterId && !keepIds.has(row.id))
            .map((row) => row.id);

          return {
            stringCreated: [...list, ...keep],
            // 목록에 담긴 줄은 되살아난 것이므로 삭제 표시를 걷는다.
            stringDeleted: [...new Set([...state.stringDeleted.filter((id) => !keepIds.has(id)), ...dropped])],
            deviceChanges: [...entries, ...state.deviceChanges],
          };
        }),
      removeString: (id, entry) =>
        set((state) => ({
          stringCreated: state.stringCreated.filter((row) => row.id !== id),
          stringDeleted: [...state.stringDeleted, id],
          deviceChanges: [entry, ...state.deviceChanges],
        })),

      savePyranometer: (item, entries, isNew) =>
        set((state) => {
          const next = upsert(state.pyranometerCreated, state.pyranometerPatched, item, (row) => row.id, isNew);

          return {
            pyranometerCreated: next.created,
            pyranometerPatched: next.patched,
            deviceChanges: [...entries, ...state.deviceChanges],
          };
        }),
      removePyranometer: (id, entry) =>
        set((state) => ({
          pyranometerDeleted: [...state.pyranometerDeleted, id],
          deviceChanges: [entry, ...state.deviceChanges],
        })),

      // 시드 id 와 겹치지 않게 접두어를 달아 준다.
      nextId: (prefix) => `${prefix}-${String(get().deviceChanges.length + 1).padStart(3, '0')}-${Date.now() % 10000}`,
      // 시드가 쓰는 번호대(1~수백)를 피해 9000 위에서 센다.
      nextSeq: () => 9000 + get().deviceChanges.length + 1,
    }),
    {
      name: 'cne-equipment',
      storage: createJSONStorage(() => localStorage),
      /*
        1 판에서 `inverter*` 는 설비를 담았고 2 판에서는 인버터 제품을 담는다.
        같은 이름에 다른 것이 들어 있으므로 옛 값을 그대로 읽으면 제품 목록에 설비가 섞인다.
        3 판에서 이력이 `kind` 대신 `targetType` 을 갖는다 — 옛 줄은 대상 구분이 없어 안 걸린다.
      */
      version: 3,
      migrate: (persisted) => ({
        ...(persisted as EquipmentState),
        inverterCreated: [],
        inverterPatched: {},
        inverterDeleted: [],
        deviceChanges: [],
      }),
    },
  ),
);

/** 시드 + 변경분을 합친 목록. 다섯 엔티티가 같은 규칙을 쓴다. */
function merge<T>(
  seed: T[],
  created: T[],
  patched: Record<string, Partial<T>>,
  deleted: string[],
  keyOf: (item: T) => string,
): T[] {
  return [...created, ...seed]
    .filter((item) => !deleted.includes(keyOf(item)))
    .map((item) => ({ ...item, ...patched[keyOf(item)] }));
}

export function mergeEquipment(
  created: EquipmentMaster[],
  patched: Record<string, Partial<EquipmentMaster>>,
  deleted: string[],
): EquipmentMaster[] {
  return merge(SEED_EQUIPMENT, created, patched, deleted, (item) => item.inverterId);
}

export function mergeInverterProducts(
  created: InverterProduct[],
  patched: Record<string, Partial<InverterProduct>>,
  deleted: string[],
): InverterProduct[] {
  return merge(SEED_INVERTER_PRODUCTS, created, patched, deleted, (item) => item.id);
}

export function mergeModules(
  created: ModuleProduct[],
  patched: Record<string, Partial<ModuleProduct>>,
  deleted: string[],
): ModuleProduct[] {
  return merge(SEED_MODULES, created, patched, deleted, (item) => item.id);
}

export function mergeStrings(
  created: StringMaster[],
  patched: Record<string, Partial<StringMaster>>,
  deleted: string[],
): StringMaster[] {
  /*
    스트링은 저장할 때 인버터 단위로 통째로 갈아 끼운다. 그래서 시드와 저장분에 같은 id 가
    함께 있으면 저장분이 이긴다 — 시드 쪽을 걸러 내지 않으면 지운 줄이 되살아난다.
  */
  const savedIds = new Set(created.map((item) => item.id));
  const savedInverters = new Set(created.map((item) => item.inverterId));
  const seed = SEED_STRINGS.filter(
    (item) => !savedIds.has(item.id) && !savedInverters.has(item.inverterId),
  );

  return merge(seed, created, patched, deleted, (item) => item.id);
}

export function mergePyranometers(
  created: Pyranometer[],
  patched: Record<string, Partial<Pyranometer>>,
  deleted: string[],
): Pyranometer[] {
  return merge(SEED_PYRANOMETERS, created, patched, deleted, (item) => item.id);
}

/** 시드 + 저장분이 합쳐진 장비 변경 이력. 갈래마다 자기 줄만 걸러 본다 (SFR-016-06) */
export function useDeviceChanges(targetType: ChangeTarget): ChangeLog[] {
  const deviceChanges = useEquipmentStore((state) => state.deviceChanges);

  return useMemo(
    () => [...deviceChanges, ...SEED_DEVICE_CHANGES].filter((item) => item.targetType === targetType),
    [deviceChanges, targetType],
  );
}

export default useEquipmentStore;
