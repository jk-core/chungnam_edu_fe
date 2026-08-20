import { InverterBoard } from './components/InverterBoard';

/** 인버터 관리 (SFR-017-04) — 등록 정보만 다룬다. 운영 상태는 통합관제·AI진단에서 본다. */
function InverterDepth() {
  return <InverterBoard />;
}

export default InverterDepth;
