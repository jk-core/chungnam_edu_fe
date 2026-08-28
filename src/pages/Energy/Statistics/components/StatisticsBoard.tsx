import { InverterDepth } from '../Inverter';
import { PowerPlantDepth } from '../PowerPlant';
import { useStatisticsView } from '../hooks/useStatisticsView';
import styles from '../Statistics.module.scss';
import { BasisTable } from './BasisTable';
import { ScopePath } from './ScopePath';
import { StatSummary } from './StatSummary';
import { StatisticsToolbar } from './StatisticsToolbar';
import { TrendSection } from './TrendSection';

/**
 * 발전통계 본문 (SFR-007, SFR-008).
 *
 * 조회 한 벌을 판 넷이 나눠 쓴다 — 요약·하위 설비·추이가 모두 같은 기간과 같은 계층에서
 * 나온 값이라야 한다. 판마다 따로 조회하면 같은 화면 안에서 합계가 갈린다.
 *
 * 뎁스에 따라 갈리는 것은 「하위 설비」 한 칸뿐이다. 인버터가 조회 단위의 끝이라 그 아래는
 * 보여만 주므로 뎁스 화면 자체가 달라진다.
 */
export function StatisticsBoard() {
  const view = useStatisticsView();
  const { basis, node, path, childKind } = view;

  /*
    지역별·교육청별은 도 전체를 한 표로 묶어 보는 축이라 아래 판들을 세우지 않는다.
    요약도 하위 설비도 추이도 고른 발전소 하나의 값인데, 집계표는 그 대상과 아무 상관이 없다 —
    함께 세우면 도 전체 표 아래에 발전소 하나의 실적이 잇대어 서서 같은 값으로 읽힌다.
  */
  if (basis !== 'device') {
    return (
      <div className={styles.tab}>
        <StatisticsToolbar view={view} />
        <BasisTable view={view} />
      </div>
    );
  }

  const Depth = node.kind === 'inverter' ? InverterDepth : PowerPlantDepth;

  return (
    <div className={styles.tab}>
      {/*
        발전 달력은 따로 놓지 않고 날짜 선택 달력 안에 얹는다 (SFR-007-01/02).
        날짜를 고르는 자리와 그 날 실적을 보는 자리가 같아야 두 번 찾지 않는다.
      */}
      <StatisticsToolbar view={view} />

      <ScopePath path={path} currentId={node.id} />

      <StatSummary view={view} />

      {childKind ? <Depth view={view} childKind={childKind} /> : null}

      {/* 시점별 추이 — 전체와 하위 설비별을 한 칸 안에서 바꿔 끼운다 */}
      <TrendSection view={view} childKind={childKind ?? null} />
    </div>
  );
}
