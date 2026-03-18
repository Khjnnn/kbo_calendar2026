/**
 * tabs.js — 탭 전환 모듈
 * 예매일정(ticket) / 경기일정(game) 탭 전환
 */

const listeners = [];

export function initTabs(onChange) {
  const tabsContainer = document.getElementById('tabs');
  const buttons = tabsContainer.querySelectorAll('.tab');

  // 콜백 등록
  if (onChange) listeners.push(onChange);

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      // 이미 활성화된 탭이면 무시
      if (btn.classList.contains('active')) return;

      // 기존 활성 탭 비활성화
      buttons.forEach(b => b.classList.remove('active'));
      // 새 탭 활성화
      btn.classList.add('active');

      const tabName = btn.dataset.tab;
      // 콜백 호출
      listeners.forEach(fn => fn(tabName));
    });
  });
}

/** 현재 활성 탭 이름 반환 */
export function getActiveTab() {
  const active = document.querySelector('.tab.active');
  return active ? active.dataset.tab : 'ticket';
}
