import { DataQualityBoard } from './components/DataQualityBoard';

/** 데이터 품질 관리 (SFR-012-10) — 발전소마다 수집 데이터가 얼마나 온전히 들어왔는지 본다. */
function DataQualityPage() {
  return <DataQualityBoard />;
}

export default DataQualityPage;
