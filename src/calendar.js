/**
 * calendar.js — 달력 렌더링 모듈
 * 월별 그리드 생성, 월 이동, 날짜 선택 이벤트
 */

const HOLIDAYS_2026 = {
  '2026-01-01': '신정',
  '2026-01-27': '설날 연휴',
  '2026-01-28': '설날',
  '2026-01-29': '설날 연휴',
  '2026-03-01': '삼일절',
  '2026-05-05': '어린이날',
  '2026-05-24': '부처님오신날',
  '2026-06-06': '현충일',
  '2026-08-15': '광복절',
  '2026-09-24': '추석 연휴',
  '2026-09-25': '추석',
  '2026-09-26': '추석 연휴',
  '2026-10-03': '개천절',
  '2026-10-09': '한글날',
  '2026-12-25': '크리스마스'
};

let currentYear = 0;
let currentMonth = 0; // 0-indexed internally
let selectedDate = null;
let markerProvider = null; // (dateStr) => { markers: [...], hasEvents: bool }
const dateSelectListeners = [];

export function initCalendar({ year, month, onDateSelect, getMarkers }) {
  currentYear = year;
  currentMonth = month - 1; // convert 1-indexed → 0-indexed
  markerProvider = getMarkers || null;

  if (onDateSelect) dateSelectListeners.push(onDateSelect);

  document.getElementById('prev-month').addEventListener('click', () => {
    changeMonth(-1);
  });
  document.getElementById('next-month').addEventListener('click', () => {
    changeMonth(1);
  });

  renderCalendar();
}

function changeMonth(delta) {
  currentMonth += delta;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  } else if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  selectedDate = null;
  renderCalendar();

  // 월 변경 이벤트
  dateSelectListeners.forEach(fn => fn(null, currentYear, currentMonth + 1));
}

export function renderCalendar() {
  const grid = document.getElementById('calendar-grid');
  const label = document.getElementById('month-label');

  // 레이블 업데이트
  label.textContent = `${currentYear}년 ${currentMonth + 1}월`;

  // 이번 달 첫 날과 마지막 날
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDow = firstDay.getDay(); // 0=일, 1=월 ...

  // 오늘
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  grid.innerHTML = '';

  // 빈 셀 (첫 주 앞부분)
  for (let i = 0; i < startDow; i++) {
    const empty = document.createElement('div');
    empty.className = 'day-cell empty';
    grid.appendChild(empty);
  }

  // 날짜 셀
  for (let d = 1; d <= lastDate; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dow = (startDow + d - 1) % 7;

    const cell = document.createElement('div');
    cell.className = 'day-cell';
    cell.dataset.date = dateStr;

    // 요일 클래스
    if (dow === 0) cell.classList.add('sunday');
    if (dow === 6) cell.classList.add('saturday');
    const holidayName = HOLIDAYS_2026[dateStr];
    if (holidayName) cell.classList.add('holiday');

    // 오늘 표시
    if (dateStr === todayStr) cell.classList.add('today');

    // 선택 상태
    if (dateStr === selectedDate) cell.classList.add('selected');

    // 날짜 숫자
    const numEl = document.createElement('span');
    numEl.className = 'day-number';
    numEl.textContent = d;
    cell.appendChild(numEl);

    // 공휴일 이름 라벨
    if (holidayName) {
      const holEl = document.createElement('span');
      holEl.className = 'holiday-name';
      holEl.textContent = holidayName;
      cell.appendChild(holEl);
    }

    // 마커 영역
    if (markerProvider) {
      const info = markerProvider(dateStr);
      if (info && info.markers && info.markers.length > 0) {
        const markersDiv = document.createElement('div');
        markersDiv.className = 'day-markers';
        info.markers.forEach((m, idx) => {
          const span = document.createElement('span');
          span.className = `marker ${m.type}`;
          span.textContent = m.emoji;
          span.style.animationDelay = `${idx * 0.05}s`;
          markersDiv.appendChild(span);
        });
        cell.appendChild(markersDiv);
      }
    }

    // 클릭 이벤트
    cell.addEventListener('click', () => {
      selectDate(dateStr);
    });

    grid.appendChild(cell);
  }
}

function selectDate(dateStr) {
  // 이전 선택 해제
  const prevSelected = document.querySelector('.day-cell.selected');
  if (prevSelected) prevSelected.classList.remove('selected');

  selectedDate = dateStr;

  const cell = document.querySelector(`.day-cell[data-date="${dateStr}"]`);
  if (cell) cell.classList.add('selected');

  dateSelectListeners.forEach(fn => fn(dateStr, currentYear, currentMonth + 1));
}

/** 마커 제공자 변경 후 달력 다시 그리기 */
export function setMarkerProvider(provider) {
  markerProvider = provider;
  renderCalendar();
}

/** 현재 표시 중인 연/월 반환 */
export function getCurrentMonth() {
  return { year: currentYear, month: currentMonth + 1 };
}

/** 현재 선택된 날짜 반환 */
export function getSelectedDate() {
  return selectedDate;
}
