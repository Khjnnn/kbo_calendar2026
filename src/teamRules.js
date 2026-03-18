/**
 * teamRules.js — 구단별 예매 규칙 로드
 * public/data/team_rules.json 에서 규칙을 fetch 합니다.
 */

let rulesCache = null;

export async function loadTeamRules() {
  if (rulesCache) return rulesCache;

  try {
    const res = await fetch('/data/team_rules.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    rulesCache = data.rules;
    return rulesCache;
  } catch (err) {
    console.error('팀 규칙 로드 실패:', err);
    return {};
  }
}

/**
 * 특정 팀의 규칙 가져오기
 * @param {string} teamKey — "LG", "KT", "두산" 등
 * @returns {object|null}
 */
export function getTeamRule(rules, teamKey) {
  return rules[teamKey] ?? null;
}
