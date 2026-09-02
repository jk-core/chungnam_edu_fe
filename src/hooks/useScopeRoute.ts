import { useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getNode, getNodePath } from '@/mocks/tree';
import usePlantStore, { useSelectedNodeId, useSelectedPlantId, useSelectNode } from '@/stores/plantStore';

/** 주소를 만드는 쪽. 화면마다 접두어가 다르니 밖에서 받는다. */
type BuildPath = (plantId?: string, inverterId?: string, unitId?: string) => string;

interface ScopeRouteOptions {
  build: BuildPath;
  /**
   * 인버터보다 깊은 자리(스트링)도 주소에 남길지.
   * 발전통계는 인버터까지만 다루므로 접어 넣고, AI진단은 그 아래까지 판정하므로 남긴다.
   */
  allowUnit?: boolean;
}

/**
 * 조회 뎁스를 주소로 잡아 준다 (SFR-007 · SFR-013).
 *
 * 발전소 한 단, 인버터 한 단이 각자 제 주소를 갖는다. 주소만 주고받아도 같은 화면이 열리고,
 * 뒤로 가기가 조회 단계를 되짚는다.
 *
 * 조회 대상은 사이드바가 함께 쓰는 스토어에 그대로 둔다. 값이 두 곳에 있으니 방향을 못박는다 —
 * 주소가 기준이고, 사용자가 고르는 순간에만 주소를 새로 쓴다.
 */
export function useScopeRoute({ build, allowUnit = false }: ScopeRouteOptions) {
  const { plantId, inverterId, unitId } = useParams<{ plantId: string; inverterId: string; unitId: string }>();
  const { pathname } = useLocation();
  const selectedId = useSelectedNodeId();
  const selectNode = useSelectNode();
  const navigate = useNavigate();

  /*
   * 주소가 설비를 가리키지 않으면(맨 주소로 들어왔거나 오래된 링크) 보고 있던 발전소로 간다.
   * 도 전체 조회는 제공하지 않으므로 "대상 없음" 상태가 없다.
   */
  const fallbackPlantId = useSelectedPlantId();
  const urlNode = getNode((allowUnit ? unitId : undefined) ?? inverterId ?? plantId ?? fallbackPlantId);
  const urlNodeId = urlNode.kind === 'root' ? fallbackPlantId : urlNode.id;

  // 구독 안에서 최신 주소를 읽어야 같은 자리로 두 번 옮기지 않는다.
  const pathnameRef = useRef(pathname);
  // 우리가 방금 주소로 밀어 넣은 선택. 주소가 따라오기 전에 되돌리지 않으려고 표시해 둔다.
  const pushedRef = useRef<string | null>(null);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // 맨 주소로 들어왔으면 지금 보고 있는 발전소를 주소에 적어 준다 — 뎁스가 주소에 남아야 한다.
  useEffect(() => {
    if (plantId) return;

    navigate(build(fallbackPlantId), { replace: true });
  }, [plantId, fallbackPlantId, navigate, build]);

  /*
   * 주소 → 조회 대상.
   *
   * 첫 진입·뒤로 가기뿐 아니라, 스토어가 딴 데서 흔들린 뒤에도 주소를 다시 세운다.
   * 저장된 발전소를 되살리는 복원(persist)이나 화면 이동 시 뎁스 초기화가 우리 뒤에 끼어들어
   * 주소와 다른 자리를 가리킬 수 있다 — 그때 기준은 주소다.
   */
  useEffect(() => {
    if (selectedId === urlNodeId) {
      pushedRef.current = null;

      return;
    }

    // 사용자가 고른 값은 아래 구독이 주소로 옮기는 중이다. 도착 전에 뺏지 않는다.
    if (pushedRef.current === selectedId) return;

    selectNode(urlNodeId);
  }, [urlNodeId, selectedId, selectNode]);

  // 조회 대상 → 주소. 사이드바든 하위 설비 카드든, 어디서 골라도 주소가 따라온다.
  useEffect(() => usePlantStore.subscribe((state, prev) => {
    if (state.selectedNodeId === prev.selectedNodeId) return;

    const path = getNodePath(state.selectedNodeId);
    const inverter = path.find((item) => item.kind === 'inverter');

    // 인버터까지만 다루는 화면이면 그 아래 자리는 인버터로 접어 넣는다.
    if (!allowUnit && inverter && inverter.id !== state.selectedNodeId) {
      selectNode(inverter.id);

      return;
    }

    const plant = path.find((item) => item.kind === 'plant');
    // 인버터보다 깊은 자리만 세 번째 칸에 적는다 — 인버터 자신은 두 번째 칸이다.
    const unit = allowUnit && inverter && inverter.id !== state.selectedNodeId
      ? state.selectedNodeId
      : undefined;
    const next = build(plant?.id, inverter?.id, unit);

    if (next === pathnameRef.current) return;

    pushedRef.current = state.selectedNodeId;
    // 한 단 내려가는 것도 한 걸음이다. 기록을 덮어쓰면 뒤로 가기가 화면을 통째로 벗어난다.
    navigate(next);
  }), [navigate, selectNode, build, allowUnit]);
}
