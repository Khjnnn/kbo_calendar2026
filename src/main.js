/**
 * main.js — KBO 달력 앱 진입점
 * 모든 모듈 초기화 및 연결
 */
import './style.css';
import { initTabs, getActiveTab } from './tabs.js';
import { initCalendar, setMarkerProvider, renderCalendar, getCurrentMonth } from './calendar.js';
import { loadGames, gameMarkerProvider, getGamesForDate, renderGameDetails, clearGameCache } from './gameSchedule.js';
import { calculateTickets, ticketMarkerProvider, getTicketsForDate, renderTicketDetails, clearTicketCache } from './ticketSchedule.js';
import { initTeamFilter } from './teamFilter.js';

// 현재 날짜
const now = new Date();
const initialYear = now.getFullYear();
const initialMonth = now.getMonth() + 1; // 1-indexed

// 데이터 로드 후 달력에 반영
async function loadMonthData(year, month) {
  const data = await loadGames(year, month);

  // 예매 일정 계산
  await calculateTickets(data.games || [], year, month);

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

  // 4. 초기 상세 패널
  updateDetailPanel(null);

  // 5. 데이터 로드
  await loadMonthData(initialYear, initialMonth);
}

// DOM 준비 후 실행
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
