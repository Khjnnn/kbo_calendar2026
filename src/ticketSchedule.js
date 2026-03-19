/**
 * ticketSchedule.js — 예매일정 탭 로직
 * 경기 데이터 + 구단 규칙으로 선예매/일반예매 오픈일 계산
 */

import { loadTeamRules } from './teamRules.js';
import { getTeamColor } from './teamColors.js';
import { filterTicketsByTeam } from './teamFilter.js';

let ticketsByDate = {}; // { "2026-03-14": [...tickets] }

const HOLIDAYS_2026 = new Set([
  '2026-01-01','2026-01-27','2026-01-28','2026-01-29',
  '2026-03-01','2026-05-05','2026-05-24','2026-06-06',
  '2026-08-15','2026-09-24','2026-09-25','2026-09-26',
  '2026-10-03','2026-10-09','2026-12-25'
]);

function isWeekendOrHoliday(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  if (day === 5 || day === 6 || day === 0) return true;
  return HOLIDAYS_2026.has(dateStr);
}

/**
 * 특정 월의 예매 일정 계산
 * 경기 데이터와 팀 규칙을 사용하여 예매 오픈일을 계산합니다.
 * @param {Array} games — 해당 월 게임 배열
 * @param {number} year
 * @param {number} month — 1-indexed
 */
export async function calculateTickets(games, year, month) {
  const rules = await loadTeamRules();
  ticketsByDate = {};

  if (!games || games.length === 0) return;

  // seriesSale 팀의 홈경기 시리즈 그룹핑
  const seriesMap = {}; // { "team-startDate": [game, game, game] }

  games.forEach(game => {
    const teamRule = rules[game.home];
    if (!teamRule) return;

    if (teamRule.seriesSale) {
      const dow = new Date(game.date + 'T00:00:00').getDay();
      // 시리즈 첫 경기: 화(2) 또는 금(5)
      const isSeriesStart = (dow === 2 || dow === 5);
      if (isSeriesStart) {
        const key = `${game.home}-${game.date}`;
        if (!seriesMap[key]) seriesMap[key] = [];
        seriesMap[key].push(game);
      } else {
        // 시리즈 내 나머지 경기 — 첫 경기 찾기
        const d = new Date(game.date + 'T00:00:00');
        let offset = 0;
        if (dow === 3) offset = 1;      // 수 → 화 -1
        else if (dow === 4) offset = 2; // 목 → 화 -2
        else if (dow === 6) offset = 1; // 토 → 금 -1
        else if (dow === 0) offset = 2; // 일 → 금 -2
        const startD = new Date(d);
        startD.setDate(startD.getDate() - offset);
        const startStr = formatDate(startD);
        const key = `${game.home}-${startStr}`;
        if (!seriesMap[key]) seriesMap[key] = [];
        seriesMap[key].push(game);
      }
      return; // seriesSale 팀은 개별 처리 안 함
    }

    // 일반 팀 — 기존 로직
    addTicketEntries(game, teamRule);
  });

  // seriesSale 팀 시리즈 처리
  Object.values(seriesMap).forEach(seriesGames => {
    if (seriesGames.length === 0) return;
    const firstGame = seriesGames.sort((a, b) => a.date.localeCompare(b.date))[0];
    const teamRule = rules[firstGame.home];
    if (!teamRule) return;

    const opponents = [...new Set(seriesGames.map(g => g.away))];
    const gameDates = seriesGames.map(g => g.date);

    addTicketEntries(firstGame, teamRule, {
      isSeries: true,
      seriesGames: gameDates,
      seriesOpponents: opponents
    });
  });
}

function addTicketEntries(game, teamRule, seriesInfo = null) {
  const gameDate = new Date(game.date + 'T00:00:00');

  // 선예매 날짜 계산
  if (teamRule.preSale && teamRule.preSale.daysBefore) {
    const preSaleDate = new Date(gameDate);
    preSaleDate.setDate(preSaleDate.getDate() - teamRule.preSale.daysBefore);
    const preSaleStr = formatDate(preSaleDate);

    if (!ticketsByDate[preSaleStr]) ticketsByDate[preSaleStr] = [];
    ticketsByDate[preSaleStr].push({
      date: preSaleStr,
      type: 'presale',
      label: teamRule.preSale.label || '선예매',
      team: game.home,
      teamName: teamRule.name,
      opponent: game.away,
      gameDate: game.date,
      time: teamRule.preSale.time || '',
      stadium: game.stadium,
      ...(seriesInfo || {})
    });
  }

  // 일반예매 날짜 계산
  if (teamRule.generalSale && teamRule.generalSale.daysBefore) {
    const generalDate = new Date(gameDate);
    generalDate.setDate(generalDate.getDate() - teamRule.generalSale.daysBefore);
    const generalStr = formatDate(generalDate);

    if (!ticketsByDate[generalStr]) ticketsByDate[generalStr] = [];
    ticketsByDate[generalStr].push({
      date: generalStr,
      type: 'general',
      label: teamRule.generalSale.label || '일반예매',
      team: game.home,
      teamName: teamRule.name,
      opponent: game.away,
      gameDate: game.date,
      time: teamRule.generalSale.time || '',
      stadium: game.stadium,
      ...(seriesInfo || {})
    });
  }
}

/**
 * 예매일정 마커 제공자
 * @param {string} dateStr
 * @returns {{ markers: Array, hasEvents: boolean }}
 */
export function ticketMarkerProvider(dateStr) {
  const tickets = filterTicketsByTeam(ticketsByDate[dateStr]);
  if (!tickets || tickets.length === 0) {
    return { markers: [], hasEvents: false };
  }

  const markers = [];
  const hasPreSale = tickets.some(t => t.type === 'presale');
  const hasGeneral = tickets.some(t => t.type === 'general');

  if (hasPreSale) markers.push({ type: 'presale', emoji: '🎫' });
  if (hasGeneral) markers.push({ type: 'general', emoji: '🎟️' });

  return { markers, hasEvents: true };
}

/**
 * 특정 날짜의 예매 목록 반환
 * @param {string} dateStr
 * @returns {Array}
 */
export function getTicketsForDate(dateStr) {
  return filterTicketsByTeam(ticketsByDate[dateStr] || []);
}

/**
 * 예매 상세 HTML 렌더링
 * @param {Array} tickets
 * @returns {string}
 */
export function renderTicketDetails(tickets) {
  if (!tickets || tickets.length === 0) {
    return `
      <div class="detail-empty">
        <span class="empty-icon">🎫</span>
        <span>이 날짜에 오픈되는 예매가 없습니다</span>
      </div>
    `;
  }

  const sorted = [...tickets].sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

  return sorted.map((ticket, idx) => {
    const tc = getTeamColor(ticket.team);
    const icon = ticket.type === 'presale'
      ? `<span class="card-icon-wrap presale-icon" style="background:${tc.light};color:${tc.primary}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="m9.5 8 5 8"/><circle cx="9" cy="9" r=".5" fill="currentColor"/><circle cx="15" cy="15" r=".5" fill="currentColor"/></svg><span class="icon-star">★</span></span>`
      : `<span class="card-icon-wrap general-icon" style="background:${tc.light};color:${tc.primary}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg></span>`;
    return `
      <div class="detail-card ticket-card ${ticket.type}${isWeekendOrHoliday(ticket.gameDate) ? ' weekend-holiday' : ''}" style="border-left-color:${tc.primary};animation-delay:${idx * 0.05}s">
        ${icon}
        <div class="card-info">
          <div class="card-teams"><span class="team-name" style="color:${tc.text}">${ticket.team}</span> <span class="vs-label">vs</span> ${ticket.opponent}</div>
          <div class="card-meta">${ticket.stadium}</div>
          <div class="card-game-date">경기일 ${formatDisplayDate(ticket.gameDate)}</div>
          ${ticket.isSeries ? `<span class="series-badge">시리즈 전체 (${ticket.seriesGames.map(d => formatShortDate(d)).join(' · ')})</span>` : ''}
        </div>
        <div style="text-align:right">
          <span class="ticket-badge ${ticket.type}">${ticket.label}</span>
          ${ticket.time ? `<div class="card-time" style="margin-top:4px">${ticket.time}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Date → "YYYY-MM-DD" 문자열
 */
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * "2026-03-28" → "3/28(토)" 간단 표시용 (시리즈 배지)
 */
function formatShortDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]})`;
}

/**
 * "2026-03-28" → "3월 28일 (토)" 형태 표시용
 */
function formatDisplayDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

/**
 * 특정 경기의 예매일 정보 조회
 * @param {string} gameDate — 경기 날짜 "2026-03-28"
 * @param {string} homeTeam — 홈팀 키 "LG"
 * @returns {Array} 해당 경기의 예매 항목 배열
 */
export function getTicketsForGame(gameDate, homeTeam) {
  const results = [];
  Object.values(ticketsByDate).forEach(tickets => {
    tickets.forEach(t => {
      if (t.team === homeTeam) {
        // 일반 경기: gameDate 직접 매칭
        if (t.gameDate === gameDate) {
          results.push(t);
        }
        // 시리즈 경기: seriesGames 배열에 포함 여부
        else if (t.isSeries && t.seriesGames && t.seriesGames.includes(gameDate)) {
          results.push(t);
        }
      }
    });
  });
  // 중복 제거 (같은 type은 한 번만)
  const seen = new Set();
  return results.filter(t => {
    const key = `${t.type}-${t.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * 캐시 초기화
 */
export function clearTicketCache() {
  ticketsByDate = {};
}
