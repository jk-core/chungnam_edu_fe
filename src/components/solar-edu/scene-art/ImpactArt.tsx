import { CastShadow, SceneDefs } from './SceneDefs';

/** 오늘 만든 전기를 바꿔 볼 수 있는 것들 */
export type ImpactArtId = 'tree' | 'house' | 'aircon' | 'lamp' | 'co2';

/**
 * 환산값 하나를 그리는 작은 그림 (SFR-005-05).
 *
 * 초등 판이 큰 수를 그림으로 세어 보일 때 쓰던 것을 눈높이와 무관한 자리로 옮겨 두었다.
 * 같은 값을 초등에서는 서른 개 늘어놓고 중등에서는 한 개만 세우지만, **같은 그림이어야** 한다 —
 * 복도에서 초등 판을 보던 아이가 교실에서 중등 판을 볼 때 같은 것을 말하고 있다는 걸 알아본다.
 *
 * 작게 늘어놓는 그림이라도 명암을 얹는다. 납작한 실루엣은 무늬로 보이고, 두께가 있어야
 * "물건" 으로 읽힌다.
 */
export function ImpactArt({ id }: { id: ImpactArtId }) {
  if (id === 'tree') {
    return (
      <svg viewBox="0 0 44 52" fill="none" role="presentation">
        <SceneDefs />
        <CastShadow cx={22} cy={48} rx={15} ry={3.5} />
        <path d="M22 2 33 20H11Z" fill="var(--ok)" />
        <path d="M22 2 33 20H22Z" fill="#0b1524" fillOpacity="0.18" />
        <path d="M22 12 37 38H7Z" fill="var(--ok)" />
        <path d="M22 12 37 38H22Z" fill="#0b1524" fillOpacity="0.18" />
        <path d="M22 12 37 38H7Z" fill="url(#edu-shine)" fillOpacity="0.5" />
        <path d="M19 38h6v10h-6Z" fill="#7d5837" />
        <path d="M19 38h2.5v10H19Z" fill="#fff" fillOpacity="0.22" />
      </svg>
    );
  }

  if (id === 'house') {
    return (
      <svg viewBox="0 0 44 52" fill="none" role="presentation">
        <SceneDefs />
        <CastShadow cx={22} cy={48} rx={16} ry={3.5} />
        <rect x="7" y="22" width="30" height="24" rx="2" fill="var(--surface)" />
        <rect x="7" y="22" width="30" height="24" rx="2" fill="url(#edu-shine)" />
        <rect x="7" y="22" width="30" height="24" rx="2" fill="url(#edu-shade)" />
        <rect x="7.8" y="22.8" width="28.4" height="22.4" rx="2" fill="none" stroke="var(--border-strong)" strokeWidth="1.4" />
        <rect x="12" y="27" width="9" height="8" rx="1.2" fill="var(--solar)" />
        <rect x="24" y="27" width="9" height="19" rx="1.2" fill="var(--brand)" fillOpacity="0.5" />
        <path d="M22 4 41 23H3Z" fill="var(--brand)" />
        <path d="M22 4 41 23H22Z" fill="#0b1524" fillOpacity="0.18" />
        <path d="M22 4 41 23H3Z" fill="url(#edu-shine)" fillOpacity="0.5" />
        <path d="M22 4 41 23H3Z" fill="none" stroke="var(--brand-contrast)" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    );
  }

  if (id === 'aircon') {
    return (
      <svg viewBox="0 0 44 52" fill="none" role="presentation">
        <SceneDefs />
        <rect x="4" y="14" width="36" height="16" rx="6" fill="var(--border-strong)" opacity="0.6" />
        <rect x="4" y="10" width="36" height="16" rx="6" fill="var(--surface)" />
        <rect x="4" y="10" width="36" height="16" rx="6" fill="url(#edu-shine)" />
        <rect x="4" y="10" width="36" height="16" rx="6" fill="url(#edu-shade)" />
        <rect x="9" y="20" width="26" height="4" rx="2" fill="var(--surface-sunken)" />
        <rect x="4.9" y="10.9" width="34.2" height="14.2" rx="5.5" fill="none" stroke="var(--border-strong)" strokeWidth="1.4" />
        <circle cx="34" cy="15" r="2.2" fill="var(--ok)" />
        <path d="M14 32q3.5 5 0 10M22 32q3.5 5 0 10M30 32q3.5 5 0 10" stroke="var(--ai-scan)" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    );
  }

  if (id === 'lamp') {
    return (
      <svg viewBox="0 0 44 52" fill="none" role="presentation">
        <SceneDefs />
        <path d="M22 4a14 14 0 0 1 9 24.6V34H13v-5.4A14 14 0 0 1 22 4Z" fill="var(--solar)" />
        <path d="M22 4a14 14 0 0 1 9 24.6V34H13v-5.4A14 14 0 0 1 22 4Z" fill="url(#edu-orb)" />
        <path d="M17 12a7 7 0 0 1 6-4" stroke="#fff" strokeOpacity="0.6" strokeWidth="2.4" strokeLinecap="round" />
        <rect x="14" y="35" width="16" height="5" rx="2" fill="var(--text-faint)" />
        <rect x="16" y="42" width="12" height="5" rx="2" fill="var(--text-faint)" />
        <rect x="14" y="35" width="16" height="2" rx="1" fill="#fff" fillOpacity="0.25" />
      </svg>
    );
  }

  /*
    줄인 온실가스.

    잎사귀나 구름으로 그리면 "자연" 이라는 기분만 남고 무엇이 줄었는지는 안 보인다.
    태우는 굴뚝을 세우고 연기에 가위표를 치는 편이 "이만큼 안 태웠다" 를 곧바로 말한다 —
    초등 판의 "연기가 나지 않아요" 와 같은 그림이라 두 판을 오가며 봐도 같은 이야기로 읽힌다.
  */
  return (
    <svg viewBox="0 0 44 52" fill="none" role="presentation">
      <SceneDefs />
      <CastShadow cx={20} cy={48} rx={16} ry={3.5} />
      <rect x="14" y="16" width="13" height="30" rx="1.5" fill="var(--text-faint)" opacity="0.75" />
      <rect x="14" y="16" width="13" height="30" rx="1.5" fill="url(#edu-shade)" />
      <rect x="12" y="13" width="17" height="5" rx="1.5" fill="var(--text-faint)" />
      <rect x="4" y="30" width="11" height="16" rx="1.5" fill="var(--text-faint)" opacity="0.6" />

      {/* 나지 않는 연기 — 옅게 두고 가위표를 얹는다 */}
      <circle cx="21" cy="9" r="5" fill="var(--text-faint)" fillOpacity="0.28" />
      <circle cx="28" cy="5" r="3.5" fill="var(--text-faint)" fillOpacity="0.2" />
      <path d="M28 4 40 16M40 4 28 16" stroke="var(--critical)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
