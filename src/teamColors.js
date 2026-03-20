/**
 * teamColors.js — KBO 10개 구단 고유 컬러 맵
 * 상세 카드, 마커 등에서 팀별 색상을 적용할 때 사용
 */

export const TEAM_COLORS = {
  'LG':   { primary: '#c00d2d', light: 'rgba(192, 13, 45, 0.10)', text: '#c00d2d', logo: 'lg' },
  'KT':   { primary: '#231f20', light: 'rgba(35, 31, 32, 0.10)', text: '#444', logo: 'kt' },
  'SSG':  { primary: '#ce0e2d', light: 'rgba(206, 14, 45, 0.10)', text: '#ce0e2d', logo: 'ssg' },
  'NC':   { primary: '#315288', light: 'rgba(49, 82, 136, 0.10)', text: '#315288', logo: 'nc' },
  '두산': { primary: '#131230', light: 'rgba(19, 18, 48, 0.12)', text: '#2a2960', logo: 'doosan' },
  'KIA':  { primary: '#ea0029', light: 'rgba(234, 0, 41, 0.10)', text: '#ea0029', logo: 'kia' },
  '롯데': { primary: '#041e42', light: 'rgba(4, 30, 66, 0.12)', text: '#0a3570', logo: 'lotte' },
  '삼성': { primary: '#074ca1', light: 'rgba(7, 76, 161, 0.10)', text: '#074ca1', logo: 'samsung' },
  '한화': { primary: '#ff6600', light: 'rgba(255, 102, 0, 0.10)', text: '#e55b00', logo: 'hanhwa' },
  '키움': { primary: '#820024', light: 'rgba(130, 0, 36, 0.10)', text: '#820024', logo: 'kiwoom' },
};

/**
 * 팀 키로 컬러 객체 반환
 * @param {string} teamKey
 * @returns {{ primary: string, light: string, text: string }}
 */
export function getTeamColor(teamKey) {
  return TEAM_COLORS[teamKey] || { primary: '#6b7280', light: 'rgba(107, 114, 128, 0.10)', text: '#6b7280' };
}
