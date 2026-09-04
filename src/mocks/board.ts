import type { BoardPost } from '@/interface/board';
import { daysAgo, daysAhead, stampAgo } from './today';

/*
  자리를 채우는 임시 그림.

  실제 첨부가 붙기 전까지 "사진이 글 안에서 바로 보인다" 를 확인하기 위한 것이다.
  이 함수와 아래 `attachments` 의 url 만 걷어내면 통째로 사라진다.
*/
function dummyImage(caption: string, tone: string): string {
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">',
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">',
    `<stop offset="0" stop-color="${tone}"/><stop offset="1" stop-color="#e2e8f0"/>`,
    '</linearGradient></defs>',
    '<rect width="960" height="540" fill="url(#g)"/>',
    '<rect x="40" y="40" width="880" height="460" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="10 8"/>',
    '<circle cx="480" cy="232" r="54" fill="#ffffff" opacity="0.72"/>',
    '<path d="M452 246l24-28 20 22 14-14 22 28z" fill="#64748b"/>',
    '<circle cx="462" cy="214" r="9" fill="#f59e0b"/>',
    `<text x="480" y="336" text-anchor="middle" font-family="sans-serif" font-size="30" fill="#475569">${caption}</text>`,
    '<text x="480" y="374" text-anchor="middle" font-family="sans-serif" font-size="19" fill="#94a3b8">예시 이미지</text>',
    '</svg>',
  ].join('');

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** 공지·문의하기 시드 (SFR-025) */
export const SEED_POSTS: BoardPost[] = [
  {
    id: 'BD-1042',
    kind: 'notice',
    title: '2026년 하반기 태양광 설비 정기점검 일정 안내',
    body:
      '2026년 하반기 정기점검을 8월 3일부터 9월 12일까지 진행합니다. 학교별 방문 일정은 첨부한 계획표를 확인해 주세요.\n\n'
      + '점검 당일에는 옥상 출입문 개방과 담당자 입회가 필요합니다. 일정 변경이 필요하면 문의하기로 알려 주세요.',
    author: '교육청 시설과',
    at: stampAgo(3, '09:10'),
    pinned: true,
    views: 412,
    attachments: [
      { name: '옥상_점검_동선.png', kind: 'image', url: dummyImage('옥상 점검 동선', '#dbeafe') },
      { name: '인버터실_출입_안내.png', kind: 'image', url: dummyImage('인버터실 출입 안내', '#fef3c7') },
      { name: '2026_하반기_정기점검_계획표.xlsx', kind: 'file', url: null },
    ],
    comments: [],
    popup: { start: daysAgo(3), end: daysAhead(11) },
  },
  {
    id: 'BD-1041',
    kind: 'notice',
    title: 'RTU 통신 모듈 교체 대상 학교 안내',
    body: 'LTE 3G 종료에 따라 구형 통신 모듈을 쓰는 12개 학교의 RTU를 순차 교체합니다. 교체 중에는 최대 2시간 수집이 멈출 수 있습니다.',
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
    attachments: [
      { name: '화면_구성_한눈에.png', kind: 'image', url: dummyImage('화면 구성 한눈에', '#dcfce7') },
      { name: '통합관리시스템_이용안내서_v1.2.pdf', kind: 'file', url: null },
    ],
    comments: [],
    popup: null,
  },
  {
    id: 'BD-1039',
    kind: 'inquiry',
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
    kind: 'inquiry',
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
