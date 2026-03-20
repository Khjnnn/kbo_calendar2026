/**
 * main.js — KBO 달력 앱 진입점
 * 모든 모듈 초기화 및 연결
 */
import './style.css';
import { initTabs, getActiveTab } from './tabs.js';
import { initCalendar, setMarkerProvider, renderCalendar, getCurrentMonth, setSelectedDate } from './calendar.js';
import { loadGames, gameMarkerProvider, getGamesForDate, renderGameDetails, clearGameCache } from './gameSchedule.js';
import { calculateTickets, ticketMarkerProvider, getTicketsForDate, renderTicketDetails, clearTicketCache, getTicketsForGame } from './ticketSchedule.js';
import { initTeamFilter } from './teamFilter.js';

// 현재 날짜
const now = new Date();
const initialYear = now.getFullYear();
const initialMonth = now.getMonth() + 1; // 1-indexed

// 데이터 로드 후 달력에 반영
async function loadMonthData(year, month) {
  const data = await loadGames(year, month);

  // 다음 월 경기도 로드 (다음 월 초 경기의 예매일이 현재 월에 해당할 수 있음)
  let nextYear = year;
  let nextMonth = month + 1;
  if (nextMonth > 12) { nextMonth = 1; nextYear++; }
  const nextData = await loadGames(nextYear, nextMonth);

  // 현재 월 + 다음 월 경기를 합쳐서 예매 일정 계산
  const allGames = [...(data.games || []), ...(nextData.games || [])];
  await calculateTickets(allGames, year, month);

  // 다음 월 로드로 덮어씌워진 gamesByDate를 현재 월로 복원
  await loadGames(year, month);

  // 현재 탭에 맞는 마커 제공자 설정
  updateMarkerProvider();
}

/** 현재 활성 탭에 따라 마커 제공자 변경 */
function updateMarkerProvider() {
  const tab = getActiveTab();
  if (tab === 'game') {
    setMarkerProvider(gameMarkerProvider);
  } else {
    setMarkerProvider(ticketMarkerProvider);
  }
}

/** 날짜 선택 또는 월 변경 시 상세 패널 업데이트 */
function handleDateSelect(dateStr, year, month) {
  // 월 변경 감지 (dateStr === null 이면 월 변경)
  if (dateStr === null) {
    clearGameCache();
    clearTicketCache();
    loadMonthData(year, month);
    updateDetailPanel(null);
    return;
  }

  updateDetailPanel(dateStr);
}

/** 상세 패널 렌더링 */
function updateDetailPanel(dateStr) {
  const panel = document.getElementById('detail-panel');
  const dateLabel = document.getElementById('detail-date');
  const list = document.getElementById('detail-list');

  if (!dateStr) {
    panel.classList.remove('has-content');
    dateLabel.textContent = '';
    list.innerHTML = `
      <div class="detail-empty">
        <span class="empty-icon">📅</span>
        <span>날짜를 선택하면 상세 정보가 표시됩니다</span>
      </div>
    `;
    return;
  }

  panel.classList.add('has-content');

  // 날짜 포맷
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  dateLabel.textContent = `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;

  const tab = getActiveTab();
  if (tab === 'game') {
    const games = getGamesForDate(dateStr);
    list.innerHTML = renderGameDetails(games);
  } else {
    const tickets = getTicketsForDate(dateStr);
    list.innerHTML = renderTicketDetails(tickets);
  }
}

/** 탭 전환 핸들러 */
function handleTabChange(tabName) {
  updateMarkerProvider();

  // 현재 선택된 날짜의 상세도 탭에 맞게 갱신
  const selected = document.querySelector('.day-cell.selected');
  if (selected) {
    updateDetailPanel(selected.dataset.date);
  } else {
    updateDetailPanel(null);
  }
}

// ========== 예매정보 모달 ==========
function initTicketModal() {
  const overlay = document.getElementById('ticket-modal-overlay');
  const closeBtn = document.getElementById('modal-close');
  const modalBody = document.getElementById('modal-body');

  // 닫기 버튼
  closeBtn.addEventListener('click', () => overlay.classList.add('hidden'));

  // 오버레이 클릭 시 닫기
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.add('hidden');
  });

  // ESC 키로 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
      overlay.classList.add('hidden');
    }
  });

  // 경기 카드 클릭 이벤트 위임
  document.getElementById('detail-list').addEventListener('click', (e) => {
    const card = e.target.closest('.game-card');
    if (!card) return;

    const gameDate = card.dataset.gameDate;
    const homeTeam = card.dataset.homeTeam;
    const awayTeam = card.dataset.awayTeam;
    const stadium = card.dataset.stadium;
    const time = card.dataset.time;
    if (!gameDate || !homeTeam) return;

    const tickets = getTicketsForGame(gameDate, homeTeam);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const gd = new Date(gameDate + 'T00:00:00');
    const gameDateDisplay = `${gd.getMonth() + 1}월 ${gd.getDate()}일 (${days[gd.getDay()]}) ${time}`;

    let html = `
      <div class="modal-game-header">
        <div class="modal-game-teams">${homeTeam} vs ${awayTeam}</div>
        <div class="modal-game-meta">${gameDateDisplay} · ${stadium}</div>
      </div>
    `;

    if (tickets.length === 0) {
      html += '<div class="modal-no-ticket">예매 일정 정보가 없습니다</div>';
    } else {
      tickets.sort((a, b) => a.date.localeCompare(b.date));
      tickets.forEach(t => {
        const td = new Date(t.date + 'T00:00:00');
        const ticketDateStr = `${td.getMonth() + 1}월 ${td.getDate()}일 (${days[td.getDay()]})`;
        const icon = t.type === 'presale' ? '🎫' : '🎟️';
        const seriesBadge = t.isSeries
          ? `<div class="modal-series-badge">시리즈 전체 예매</div>`
          : '';
        html += `
          <div class="modal-ticket-item ${t.type}">
            <span class="modal-ticket-icon">${icon}</span>
            <div class="modal-ticket-info">
              <div class="modal-ticket-type">${t.label}</div>
              <div class="modal-ticket-date">${ticketDateStr}</div>
              ${t.time ? `<div class="modal-ticket-time">${t.time} 오픈</div>` : ''}
              ${seriesBadge}
            </div>
          </div>
        `;
      });
    }

    modalBody.innerHTML = html;
    overlay.classList.remove('hidden');
  });
}

// ========== 앱 초기화 ==========
/** 필터 변경 시 달력 + 상세 패널 갱신 */
function handleFilterChange() {
  renderCalendar();
  const selected = document.querySelector('.day-cell.selected');
  if (selected) {
    updateDetailPanel(selected.dataset.date);
  }
}

async function init() {
  // 1. 탭 초기화
  initTabs(handleTabChange);

  // 2. 구단 필터 초기화
  initTeamFilter(handleFilterChange);

  // 3. 달력 초기화
  initCalendar({
    year: initialYear,
    month: initialMonth,
    onDateSelect: handleDateSelect,
    getMarkers: ticketMarkerProvider // 기본 탭은 예매일정
  });

  // 4. 예매정보 모달 초기화
  initTicketModal();

  // 5. 데이터 로드
  await loadMonthData(initialYear, initialMonth);

  // 6. 오늘 날짜 자동 선택
  const todayStr = `${initialYear}-${String(initialMonth).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const todayCell = document.querySelector(`.day-cell[data-date="${todayStr}"]`);
  if (todayCell) {
    setSelectedDate(todayStr);
    todayCell.classList.add('selected');
    updateDetailPanel(todayStr);
  } else {
    updateDetailPanel(null);
  }
}

// DOM 준비 후 실행
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
