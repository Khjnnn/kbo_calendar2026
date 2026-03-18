/**
 * teamFilter.js — 구단 필터 모듈
 * 달력 위에 구단 체크박스를 표시하고, 선택된 구단만 필터링
 */

import { TEAM_COLORS } from './teamColors.js';

const ALL_TEAMS = ['LG', 'KT', 'SSG', 'NC', '두산', 'KIA', '롯데', '삼성', '한화', '키움'];
let selectedTeams = new Set(ALL_TEAMS);
let onChangeCallback = null;

/**
 * 필터 UI 초기화
 * @param {Function} onChange — 필터 변경 시 호출될 콜백
 */
export function initTeamFilter(onChange) {
  onChangeCallback = onChange;

  const container = document.getElementById('team-filter');
  if (!container) return;

  // 전체 선택/해제 버튼
  const allBtn = document.createElement('button');
  allBtn.className = 'team-chip team-chip-all active';
  allBtn.textContent = '전체';
  allBtn.addEventListener('click', () => toggleAll());
  container.appendChild(allBtn);

  // 각 구단 칩
  ALL_TEAMS.forEach(team => {
    const chip = document.createElement('button');
    chip.className = 'team-chip active';
    chip.dataset.team = team;

    const colors = TEAM_COLORS[team];
    chip.style.setProperty('--chip-color', colors.primary);
    chip.style.setProperty('--chip-bg', colors.light);

    const dot = document.createElement('span');
    dot.className = 'chip-dot';
    dot.style.background = colors.primary;
    chip.appendChild(dot);

    const label = document.createElement('span');
    label.textContent = team;
    chip.appendChild(label);

    chip.addEventListener('click', () => toggleTeam(team));
    container.appendChild(chip);
  });
}

function toggleTeam(team) {
  if (selectedTeams.has(team)) {
    selectedTeams.delete(team);
  } else {
    selectedTeams.add(team);
  }
  updateChipStates();
  if (onChangeCallback) onChangeCallback();
}

function toggleAll() {
  if (selectedTeams.size === ALL_TEAMS.length) {
    selectedTeams.clear();
  } else {
    selectedTeams = new Set(ALL_TEAMS);
  }
  updateChipStates();
  if (onChangeCallback) onChangeCallback();
}

function updateChipStates() {
  const container = document.getElementById('team-filter');
  if (!container) return;

  const allBtn = container.querySelector('.team-chip-all');
  if (allBtn) {
    allBtn.classList.toggle('active', selectedTeams.size === ALL_TEAMS.length);
  }

  container.querySelectorAll('.team-chip[data-team]').forEach(chip => {
    const team = chip.dataset.team;
    chip.classList.toggle('active', selectedTeams.has(team));
  });
}

/**
 * 현재 선택된 구단 Set 반환
 * @returns {Set<string>}
 */
export function getSelectedTeams() {
  return selectedTeams;
}

/**
 * 경기 배열을 선택된 구단의 홈경기만 필터링
 * @param {Array} games
 * @returns {Array}
 */
export function filterGamesByTeam(games) {
  if (!games) return [];
  if (selectedTeams.size === ALL_TEAMS.length) return games;
  return games.filter(g => selectedTeams.has(g.home));
}

/**
 * 티켓 배열을 선택된 구단의 홈경기만 필터링
 * @param {Array} tickets
 * @returns {Array}
 */
export function filterTicketsByTeam(tickets) {
  if (!tickets) return [];
  if (selectedTeams.size === ALL_TEAMS.length) return tickets;
  return tickets.filter(t => selectedTeams.has(t.team));
}
