import type { BoardPost } from '@/interface/board';
import { daysAgo, daysAhead, stampAgo } from './today';

/** 공지·Q&A 시드 (SFR-025) */
export const SEED_POSTS: BoardPost[] = [
  {
    id: 'BD-1042',
    kind: 'notice',
    title: '2026년 하반기 태양광 설비 정기점검 일정 안내',
    body:
      '2026년 하반기 정기점검을 8월 3일부터 9월 12일까지 진행합니다. 학교별 방문 일정은 첨부한 계획표를 확인해 주세요.\n\n'
      + '점검 당일에는 옥상 출입문 개방과 담당자 입회가 필요합니다. 일정 변경이 필요하면 Q&A 로 알려 주세요.',
    author: '교육청 시설과',
    at: stampAgo(3, '09:10'),
    pinned: true,
    views: 412,
    attachments: ['2026_하반기_정기점검_계획표.xlsx'],
    comments: [],
    popup: { start: daysAgo(3), end: daysAhead(11) },
  },
  {
    id: 'BD-1041',
    kind: 'notice',
    title: '수집장치 통신 모듈 교체 대상 학교 안내',
    body: 'LTE 3G 종료에 따라 구형 통신 모듈을 쓰는 12개 학교의 수집장치를 순차 교체합니다. 교체 중에는 최대 2시간 수집이 멈출 수 있습니다.',
    author: '교육청 시설과',
    at: stampAgo(9, '14:35'),
    pinned: false,
    views: 268,
    attachments: [],
    comments: [],
    popup: null,
  },
  {
    id: 'BD-1038',
    kind: 'notice',
    title: '통합관리시스템 이용 안내서 배포',
    body: '발전 현황 조회부터 현장보고서 작성까지 담은 이용 안내서를 올렸습니다. 각 화면 우측 상단 도움말과 함께 보시면 됩니다.',
    author: '교육과정평가정보원',
    at: stampAgo(21, '11:00'),
    pinned: false,
    views: 731,
    attachments: ['통합관리시스템_이용안내서_v1.2.pdf'],
    comments: [],
    popup: null,
  },
  {
    id: 'BD-1039',
    kind: 'qna',
    title: '발전량이 어제보다 크게 낮은데 확인 부탁드립니다',
    body: '어제 대비 발전량이 40% 정도 낮게 나옵니다. 날씨는 비슷했는데 원인을 알 수 있을까요?',
    author: '온양초등학교',
    at: stampAgo(2, '16:20'),
    pinned: false,
    views: 47,
    attachments: [],
    comments: [
      {
        id: 'CM-1',
        author: '교육청 시설과',
        body: 'AI진단 > 고장진단 조회에서 해당 기간을 보시면 스트링 2번 진단 효율이 62%로 떨어져 있습니다. 접속함 퓨즈 점검을 요청드렸습니다.',
        at: stampAgo(2, '17:05'),
      },
      { id: 'CM-2', author: '온양초등학교', body: '확인했습니다. 내일 오전 업체 방문 예정입니다.', at: stampAgo(1, '09:12') },
    ],
    popup: null,
  },
  {
    id: 'BD-1036',
    kind: 'qna',
    title: '현장보고서 제출 후 수정이 가능한가요?',
    body: '제출완료 상태에서 사진을 한 장 더 붙이고 싶습니다.',
    author: '반포중학교',
    at: stampAgo(12, '10:48'),
    pinned: false,
    views: 63,
    attachments: [],
    comments: [
      {
        id: 'CM-3',
        author: '교육청 시설과',
        body: '검토중 단계까지는 수정할 수 있고, 수정 내역은 이력에 남습니다. 확인완료 이후에는 새 보고서로 올려 주세요.',
        at: stampAgo(12, '13:30'),
      },
    ],
    popup: null,
  },
];
