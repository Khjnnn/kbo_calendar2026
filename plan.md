# KBO 모바일 달력 프로젝트 기획서

KBO 야구 경기 일정과 구단별 티켓 예매 일정을 한눈에 볼 수 있는 **모바일 웹 달력** 프로젝트.  
Vite(Vanilla JS) 정적 사이트로 구축하고 **Cloudflare Pages**로 배포합니다.

---

## 핵심 기능

| 기능 | 설명 |
|------|------|
| **경기일정 탭** | 현재 월 달력에 홈/원정 경기 일정 표시 |
| **예매일정 탭** | 구단별 선예매·일반예매 오픈일을 계산하여 달력에 표시 |
| **월 이동** | ◀ ▶ 버튼으로 이전/다음 월 전환 |
| **이미지→JSON 변환** | 경기 일정 공지 이미지를 업로드하면 JSON 데이터로 변환 (로컬 전용 스킬) |

---

## 프로젝트 구조

```
calander_kbo/
├── index.html                  # 메인 페이지
├── package.json
├── vite.config.js
│
├── public/
│   └── data/                   # ⭐ JSON 데이터 폴더 (정적 서빙)
│       ├── games_2026_03.json  # 경기일정 데이터
│       ├── games_2026_04.json
│       └── ...
│
├── src/
│   ├── main.js                 # 앱 진입점
│   ├── style.css               # 전체 스타일
│   ├── calendar.js             # 달력 렌더링 모듈
│   ├── tabs.js                 # 탭 전환 모듈
│   ├── ads.js                  # 광고 섹션 관리 모듈
│   ├── gameSchedule.js         # 경기일정 탭 로직
│   ├── ticketSchedule.js       # 예매일정 탭 로직 (계산 포함)
│   └── teamRules.js            # 구단별 선예매/일반예매 규칙 매핑
│
└── tools/
    └── image-to-json/          # 로컬 전용 변환 스킬
        ├── README.md
        └── convert.js          # 이미지→JSON 변환 스크립트
```

---

## 데이터 모델

### 경기일정 JSON (`public/data/games_YYYY_MM.json`)

```json
{
  "month": "2026-03",
  "games": [
    {
      "date": "2026-03-28",
      "day": "토",
      "home": "LG",
      "away": "KT",
      "time": "14:00",
      "stadium": "잠실"
    }
  ]
}
```

### 구단별 예매 규칙 (`src/teamRules.js`)

> [!IMPORTANT]
> **구단별 선예매/일반예매 규칙은 사용자 확인이 필요합니다.**
> 각 구단마다 경기일 기준 며칠 전에 선예매, 일반예매가 열리는지 규칙이 다릅니다.
> 아래는 플레이스홀더 예시이며, 실제 규칙을 알려주시면 반영하겠습니다.

```js
// 예시 구조: 경기일 기준 몇 일 전 오픈되는지
const TEAM_RULES = {
  "LG":  { preSale: -14, generalSale: -7 },
  "KT":  { preSale: -14, generalSale: -7 },
  "SSG": { preSale: -14, generalSale: -7 },
  "NC":  { preSale: -14, generalSale: -7 },
  "두산": { preSale: -14, generalSale: -7 },
  "KIA": { preSale: -14, generalSale: -7 },
  "롯데": { preSale: -14, generalSale: -7 },
  "삼성": { preSale: -14, generalSale: -7 },
  "한화": { preSale: -14, generalSale: -7 },
  "키움": { preSale: -14, generalSale: -7 },
};
```

계산 결과로 생성되는 예매 데이터:

```json
{
  "date": "2026-03-14",
  "type": "선예매",
  "team": "LG",
  "gameDate": "2026-03-28",
  "opponent": "KT"
}
```

---

## 탭 구조 & UI 설계

```
┌────────────────────────────────┐
│  ⚾ KBO 달력                    │
├───────────────┬────────────────┤
│  예매일정      │  경기일정       │  ← 2개 탭
├───────────────┴────────────────┤
│          [ 광고 배너 ]           │  ← 상단 광고 영역
├────────────────────────────────┤
│     ◀  2026년 3월  ▶           │  ← 월 이동
├──┬──┬──┬──┬──┬──┬──┤
│일│월│화│수│목│금│토│
├──┼──┼──┼──┼──┼──┼──┤
│  │  │  │  │  │  │ 1│
├──┼──┼──┼──┼──┼──┼──┤
│ 2│ 3│ 4│ 5│ 6│ 7│ 8│
│  │  │  │  │🎫│  │  │  ← 이벤트 마커
├──┴──┴──┴──┴──┴──┴──┤
│  [날짜 클릭 시 상세]  │  ← 하단 상세 영역
│  - LG vs KT 선예매    │
│  - SSG vs NC 일반예매  │
├────────────────────────────────┤
│          [ 광고 배너 ]           │  ← 하단 광고 영역
└────────────────────────────────┘
```

> [!NOTE]
> 광고 영역은 **탭 아래(달력 위)** + **상세 영역 아래** 2곳에 배치.
> Google AdSense 등 원하는 광고 코드를 삽입할 수 있는 빈 `<div>` 슬롯으로 제공합니다.

### 경기일정 탭
- 해당 날짜에 경기가 있으면 **⚾ 마커** 표시
- 날짜 클릭 시 하단에 경기 상세 (홈팀 vs 원정팀, 시간, 구장)

### 예매일정 탭
- 해당 날짜에 예매 오픈이 있으면 **🎫 마커** 표시
- 색상 구분: 선예매(주황) / 일반예매(초록)
- 날짜 클릭 시 하단에 예매 목록 (어떤 구단, 어떤 경기의 예매인지)

---

## 기술 스택

| 항목 | 선택 | 이유 |
|------|------|------|
| 빌드 | **Vite (Vanilla JS)** | 경량, 빠른 빌드 |
| 스타일 | **Vanilla CSS** | 프레임워크 불필요, 풀 커스텀 |
| 배포 | **Cloudflare Pages** | 정적 사이트 무료 호스팅, 글로벌 CDN |
| 광고 | **Google AdSense** 등 | 상단/하단 배너 슬롯 제공 |
| 이미지→JSON | **Node.js 스크립트** (로컬) | 로컬에서만 실행, 수동 업로드 |

---

## Proposed Changes

### 1. 프로젝트 초기화

#### [NEW] [package.json](file:///C:/Users/Pro/Documents/calander_kbo/package.json)
- Vite + Vanilla JS 프로젝트 (`npx -y create-vite@latest ./ --template vanilla`)

#### [NEW] [vite.config.js](file:///C:/Users/Pro/Documents/calander_kbo/vite.config.js)
- `public/data/` 폴더 정적 서빙 설정

---

### 2. 핵심 앱 코드

#### [NEW] [index.html](file:///C:/Users/Pro/Documents/calander_kbo/index.html)
- 모바일 viewport 설정, 탭/달력/상세 영역 + **광고 슬롯** 마크업

#### [NEW] [src/style.css](file:///C:/Users/Pro/Documents/calander_kbo/src/style.css)
- 모바일 퍼스트 CSS: 다크 모드, 그리드 달력, 탭 스타일, 마커 애니메이션

#### [NEW] [src/main.js](file:///C:/Users/Pro/Documents/calander_kbo/src/main.js)
- 앱 초기화, 탭/달력 모듈 연결

#### [NEW] [src/calendar.js](file:///C:/Users/Pro/Documents/calander_kbo/src/calendar.js)
- 월별 달력 그리드 렌더링, 월 이동, 날짜 선택 이벤트

#### [NEW] [src/tabs.js](file:///C:/Users/Pro/Documents/calander_kbo/src/tabs.js)
- 예매일정/경기일정 탭 전환 로직

#### [NEW] [src/ads.js](file:///C:/Users/Pro/Documents/calander_kbo/src/ads.js)
- 광고 배너 슬롯 초기화 및 관리 (AdSense 등 외부 광고 코드 삽입 지원)

#### [NEW] [src/gameSchedule.js](file:///C:/Users/Pro/Documents/calander_kbo/src/gameSchedule.js)
- JSON 로드, 경기일에 마커 표시, 날짜별 상세 표시

#### [NEW] [src/ticketSchedule.js](file:///C:/Users/Pro/Documents/calander_kbo/src/ticketSchedule.js)
- `teamRules.js`의 규칙으로 예매 오픈일 계산, 마커 표시

#### [NEW] [src/teamRules.js](file:///C:/Users/Pro/Documents/calander_kbo/src/teamRules.js)
- 10개 구단별 선예매/일반예매 규칙 매핑 (경기일 기준 며칠 전)

---

### 3. 데이터 폴더

#### [NEW] [public/data/games_2026_03.json](file:///C:/Users/Pro/Documents/calander_kbo/public/data/games_2026_03.json)
- 샘플 경기일정 데이터 (스키마 확인용)

---

### 4. 이미지→JSON 변환 도구 (로컬 전용)

#### [NEW] [tools/image-to-json/README.md](file:///C:/Users/Pro/Documents/calander_kbo/tools/image-to-json/README.md)
- 사용법 안내

#### [NEW] [tools/image-to-json/convert.js](file:///C:/Users/Pro/Documents/calander_kbo/tools/image-to-json/convert.js)
- 이미지 → 구조화된 JSON 변환 Node.js 스크립트
- 실행: `node tools/image-to-json/convert.js <이미지경로>`
- 출력: `public/data/games_YYYY_MM.json`

> [!NOTE]
> 이 도구는 로컬에서만 실행되며, 생성된 JSON을 수동으로 `public/data/`에 넣은 뒤 Git push → Cloudflare Pages 자동 배포됩니다.
> 이미지 인식은 사용자가 직접 AI 도구(Antigravity 등)에 이미지를 제공하여 JSON을 추출하는 **에이전트 스킬** 형태로도 제공합니다.

---

## User Review Required

> [!IMPORTANT]
> **구단별 예매 규칙 정보가 필요합니다.**
> 각 구단(LG, KT, SSG, NC, 두산, KIA, 롯데, 삼성, 한화, 키움)이
> 경기일 기준 며칠 전에 선예매/일반예매를 오픈하는지 정확한 규칙을 알려주세요.
> (예: LG - 선예매 경기 14일 전, 일반예매 경기 7일 전)
>
> 또한 선예매/일반예매 오픈 **시간**도 다르다면 알려주세요.

> [!NOTE]
> 이 외의 프로젝트 구조, 기술 스택, UI 설계 등에 대해 피드백이 있으시면 말씀해주세요.

---

## Verification Plan

### 로컬 개발 서버 테스트
```bash
cd C:\Users\Pro\Documents\calander_kbo
npm install
npm run dev
```
- 브라우저에서 `http://localhost:5173` 접속

### 브라우저 확인 항목
1. **탭 전환** — 예매일정↔경기일정 탭 클릭 시 정상 전환
2. **달력 표시** — 현재 월(2026년 3월) 달력 정상 렌더링
3. **월 이동** — ◀ ▶ 클릭 시 이전/다음 월 전환
4. **경기일정 탭** — 샘플 데이터의 경기일에 ⚾ 마커 표시, 클릭 시 상세
5. **예매일정 탭** — 계산된 예매일에 🎫 마커 표시, 클릭 시 상세
6. **모바일 대응** — 375px 뷰포트에서 정상 표시

### 수동 확인 (사용자)
- 실제 구단별 예매 규칙이 올바르게 적용되는지 확인
- Cloudflare Pages 배포 후 모바일 기기에서 접속 테스트
- 광고 슬롯 정상 표시 확인
