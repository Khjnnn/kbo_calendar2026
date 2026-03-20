/**
 * gameSchedule.js — 경기일정 탭 로직
 * JSON 데이터 로드, 마커 제공, 상세 표시
 */

import { getTeamColor } from './teamColors.js';
import { filterGamesByTeam } from './teamFilter.js';

let gamesData = {}; // { "2026-03": { month, games: [...] } }
let gamesByDate = {}; // { "2026-03-28": [...games] }

const HOLIDAYS_2026 = new Set([
  '2026-01-01','2026-01-27','2026-01-28','2026-01-29',
  '2026-03-01','2026-05-05','2026-05-24','2026-06-06',
  '2026-08-15','2026-09-24','2026-09-25','2026-09-26',
  '2026-10-03','2026-10-09','2026-12-25'
]);

function isWeekendOrHoliday(dateStr, day) {
  if (day === '금' || day === '토' || day === '일') return true;
  return HOLIDAYS_2026.has(dateStr);
}

/**
 * 특정 월의 경기 데이터 로드
 * @param {number} year
 * @param {number} month — 1-indexed
 */
export async function loadGames(year, month) {
  const key = `${year}-${String(month).padStart(2, '0')}`;
  if (gamesData[key]) {
    buildGameIndex(key);
    return gamesData[key];
  }

  try {
    const res = await fetch(`/data/games_${year}_${String(month).padStart(2, '0')}.json`);
    if (!res.ok) {
      // 해당 월 데이터가 없으면 빈 배열
      gamesData[key] = { month: key, games: [] };
      buildGameIndex(key);
      return gamesData[key];
    }
    const data = await res.json();
    gamesData[key] = data;
    buildGameIndex(key);
    return data;
  } catch (err) {
    console.warn(`경기 데이터 없음: ${key}`, err);
    gamesData[key] = { month: key, games: [] };
    buildGameIndex(key);
    return gamesData[key];
  }
}

/** 날짜별 인덱스 구축 */
function buildGameIndex(monthKey) {
  const data = gamesData[monthKey];
  if (!data || !data.games) return;

  // 해당 월 기존 항목 제거 (중복 방지)
  const prefix = monthKey; // "2026-03"
  Object.keys(gamesByDate).forEach(dateKey => {
    if (dateKey.startsWith(prefix)) {
      delete gamesByDate[dateKey];
    }
  });

  data.games.forEach(game => {
    if (!gamesByDate[game.date]) {
      gamesByDate[game.date] = [];
    }
    gamesByDate[game.date].push(game);
  });
}

/**
 * 경기일정 마커 제공자
 * @param {string} dateStr — "2026-03-28"
 * @returns {{ markers: Array, hasEvents: boolean }}
 */
export function gameMarkerProvider(dateStr) {
  const games = filterGamesByTeam(gamesByDate[dateStr]);
  if (!games || games.length === 0) {
    return { markers: [], hasEvents: false };
  }

  return {
    markers: [{ type: 'game', icon: '/img/icon_ball.svg' }],
    hasEvents: true
  };
}

/**
 * 특정 날짜의 경기 목록 반환
 * @param {string} dateStr
 * @returns {Array}
 */
export function getGamesForDate(dateStr) {
  return filterGamesByTeam(gamesByDate[dateStr] || []);
}

/**
 * 경기 상세 HTML 렌더링
 * @param {Array} games
 * @returns {string}
 */
export function renderGameDetails(games) {
  if (!games || games.length === 0) {
    return `
      <div class="detail-empty">
        <span class="empty-icon">⚾</span>
        <span>이 날짜에 예정된 경기가 없습니다</span>
      </div>
    `;
  }

  return games.map((game, idx) => {
    const tc = getTeamColor(game.home);
    return `
      <div class="detail-card game-card${isWeekendOrHoliday(game.date, game.day) ? ' weekend-holiday' : ''}" style="border-left-color:${tc.primary};animation-delay:${idx * 0.05}s" data-game-date="${game.date}" data-home-team="${game.home}" data-away-team="${game.away}" data-stadium="${game.stadium}" data-time="${game.time}">
        <span class="card-icon-wrap" style="background:${tc.light}"><img class="team-logo" src="/img/team_logo/${tc.logo || 'lg'}.png" alt="${game.home}" /><span class="card-badge game-badge">⚾</span></span>
        <div class="card-info">
          <div class="card-teams"><span class="team-name" style="color:${tc.text}">${game.home}</span> <span class="vs-label">vs</span> ${game.away}</div>
          <div class="card-meta">${game.stadium}</div>
        </div>
        <span class="card-time">${game.time}</span>
      </div>
    `;
  }).join('');
}

/**
 * 캐시 초기화 (월 변경 시 호출 가능)
 */
export function clearGameCache() {
  // 인덱스만 클리어 (데이터 캐시는 유지)
  gamesByDate = {};
}
