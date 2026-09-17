import type { RtuEnterprise } from '@/interface/deviceMaster';

/*
  RTU 업체 마스터 (SFR-016-01).

  발전소 등록 폼이 업체명을 손으로 받고 있어, 고를 목록이 없으면 같은 업체가 표기만 달리한 채
  흩어진다. 연락처가 한쪽만 있는 곳과 이름이 아주 긴 곳을 섞어 둔다 — 표와 폼이 견디는지 본다.
*/

export const SEED_RTU_ENTERPRISES: RtuEnterprise[] = [
  { id: 'rtuent-01', rtuEnterpriseId: 1, name: '한빛솔라건설', email: 'rtu@hanbit-solar.co.kr', phone: '041-552-1100' },
  {
    id: 'rtuent-02',
    rtuEnterpriseId: 2,
    name: '대성에너지산업',
    email: 'service@daesung-energy.co.kr',
    phone: '042-331-2200',
  },
  { id: 'rtuent-03', rtuEnterpriseId: 3, name: '금강그린텍', email: '', phone: '041-856-3300' },
  { id: 'rtuent-04', rtuEnterpriseId: 4, name: '서해태양광', email: 'help@seohae-pv.kr', phone: '' },
  { id: 'rtuent-05', rtuEnterpriseId: 5, name: '충남에너지관리', email: 'cn@cnenergy.co.kr', phone: '041-577-7010' },
  {
    id: 'rtuent-06',
    rtuEnterpriseId: 6,
    name: '내포신도시 태양광발전설비 종합유지관리 주식회사',
    email: 'naepo.solar.maintenance.center@naepo-solar-maintenance.co.kr',
    phone: '041-630-9900',
  },
];
