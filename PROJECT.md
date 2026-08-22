# Project: Frontend Engineering Refactor & Modernization

## Architecture
- **Framework**: React 19.2.8 + Vite 8.2.0 (ESM) + React Router DOM 7.13.1 + Framer Motion 12.36.0
- **Domain Modules**:
  1. **Public Experience**: `HomePage`, `ApplyPage`, `SiteShell`, `PortfolioDeck`, `HeroVideoBackground`, `PageFlipSection`, `PreviousWork`
  2. **Applicant & Reviewer Systems**: `ApplicationForm`, `ReviewerDashboard`, `DashboardPage`, `client.js`
  3. **Administrative Management**: `AdminLogin`, `AdminDashboardPage`, `adminApi.js`, SheetJS export suite
  4. **Live Arena Broadcast & Host Console**: `AudienceDisplayPage`, `LiveLeaderboardPage`, `liveGameApi.js`, `AudienceDisplayPage.css`
  5. **Static Assets & Legacy Modules**: `public/flipcard/js/*.js`

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | ESLint Config & Tooling Modernization | Scope ESLint for React 19 ESM (`src/`) and standalone browser scripts (`public/flipcard/js/`) | M1 | Survey |
| 2 | API Services & Mock Fallbacks | Retain REST endpoints, auth tokens (`aarna_admin_token`), local mock persistence (`aarana_mock_applications`) | M2 | Survey |
| 3 | Live Game Socket Telemetry & Protocol | Retain WebSocket event bindings (`game_state`, `leaderboard_update`, `game_started`, `game_ended`, `leaderboard_reset`) | M2 | Survey |
| 4 | Data Models & Responsive Hooks | Single source of truth in `clubContent.js`, responsive listener `useIsMobile.js`, theme manager `useTheme.js` | M2 | Survey |
| 5 | Master Styles & Design Tokens | Master CSS tokens, mobile overflow prevention (`overflow-x: clip`), tap target standards (>=44x44px), dark/light theme | M3 | Survey |
| 6 | Site Navigation & Mobile Drawer | Responsive header, animated mobile drawer with body scroll locking, theme switcher, keyboard support | M3 | Survey |
| 7 | Interactive UI Components | Hero video background, 3D scroll flip section, 3D portfolio card deck, infinite marquee with lightbox modal | M3 | Survey |
| 8 | Recruitment Form & Status Timeline | Multi-step application form with autosave draft, recruitment closed timeline in ApplyPage | M4 | Survey |
| 9 | Reviewer Dashboard & Public Pages | Reviewer portal with applicant filters & drawer, landing page notice modal & sections, root routing | M4 | Survey |
| 10 | Live Arena Stage Screen | Fullscreen broadcast screen for projectors, top-3 podium, countdown sequencer, grand champion modal, hook fixes | M5 | Survey |
| 11 | Host Game Control Console | Live host controls (start/stop round, reset, CSV export), ranking tables, zero lint issues | M5 | Survey |
| 12 | Admin Dashboard & Role Management | Super Admin/Sub-Admin RBAC, applicant search & filter, virtualized rendering, Excel/CSV export | M5 | Survey |
| 13 | Quality Gates & Verification | `npm run lint` with 0 errors/0 warnings, `npm run build` clean build, responsive/a11y test suites | M6 | Survey |
| 14 | Forensic Integrity Audit | Multi-agent Reviewer, Challenger, and Forensic Auditor verification with zero integrity violations | M6 | Survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Root Infrastructure & ESLint Configuration | `eslint.config.js`, `vite.config.js`, `package.json`, `index.html` | none | PLANNED |
| M2 | API Services, Data Models & Utility Hooks | `src/api/client.js`, `src/api/adminApi.js`, `src/api/liveGameApi.js`, `src/data/clubContent.js`, `src/hooks/useIsMobile.js`, `src/hooks/useTheme.js` | M1 | PLANNED |
| M3 | Shared Layout, Global Styles & Core Components | `src/index.css`, `src/components/SiteShell.jsx`, `src/components/HeroVideoBackground.jsx`, `src/components/PageFlipSection.jsx`, `src/components/PortfolioDeck.jsx`, `src/components/PreviousWork.jsx` | M1, M2 | PLANNED |
| M4 | Forms, Reviewer Dashboard & Public Pages | `src/components/ApplicationForm.jsx`, `src/components/ReviewerDashboard.jsx`, `src/pages/HomePage.jsx`, `src/pages/ApplyPage.jsx`, `src/pages/DashboardPage.jsx`, `src/App.jsx`, `src/main.jsx` | M2, M3 | PLANNED |
| M5 | Live Arena & Admin Consoles | `src/pages/AudienceDisplayPage.jsx`, `src/pages/AudienceDisplayPage.css`, `src/pages/admin/LiveLeaderboardPage.jsx`, `src/pages/admin/AdminDashboardPage.jsx`, `src/pages/admin/AdminLogin.jsx`, `public/flipcard/js/*.js` | M2, M3 | PLANNED |
| M6 | Quality Gates, Responsive/A11y Verification & Forensic Audit | Comprehensive project-wide verification: `npm run lint` (0 errors, 0 warnings), `npm run build`, responsive validation (320px–1024px+), Reviewers, Challengers, Auditor | M1, M2, M3, M4, M5 | PLANNED |

## Interface Contracts
### Public API Client (`src/api/client.js`)
- `api.submitApplication(formData)`: `POST /applications` -> returns `{ success: true, application }` (offline fallback to `aarana_mock_applications`)
- `api.adminSession(secret)`: `POST /admin/session` -> returns `{ success: true, token }`
- `api.getApplications(token)`: `GET /admin/applications`
- `api.getSyncStatus(token)`: `GET /admin/sync-status`
- `api.wakeup()`: `OPTIONS /applications` (fire-and-forget server wakeup)

### Admin API Client (`src/api/adminApi.js`)
- `adminApi.login(rollNumber, password)`: `POST /login` -> sets `aarna_admin_token`, `aarna_admin_info`
- `adminApi.getMe()`: `GET /me` (Authorization: Bearer)
- `adminApi.getApplicants()`: `GET /applicants`
- `adminApi.createSubAdmin(data)`: `POST /create`
- `adminApi.getSubAdmins()`: `GET /subadmins`
- `adminApi.logout()`: clears `aarna_admin_token`, `aarna_admin_info`

### Live Game Socket & REST API (`src/api/liveGameApi.js`)
- Socket events: `game_state`, `game_started`, `game_ended`, `leaderboard_update`, `leaderboard_reset`
- `liveGameApi.getScores()`: `GET /api/games/leaderboard`
- `liveGameApi.adminLogin(password)`: `POST /api/admin/login`
- `liveGameApi.startGame(adminPassword)`: `POST /api/admin/game/start`
- `liveGameApi.stopGame(adminPassword)`: `POST /api/admin/game/stop`
- `liveGameApi.resetLobby(adminPassword)`: `POST /api/admin/game/reset-lobby`
- `liveGameApi.resetAllData(adminPassword)`: `POST /api/admin/reset`
- `liveGameApi.exportCsv(adminPassword)`: `GET /api/admin/export-csv`

### Club Content Data Model (`src/data/clubContent.js`)
- `export const portfolios`: Array of `{ name, short, desc, icon, color, tools, domain, eligibility, interviewFocus, badge }`
- `export const objectives`: Array of `{ num, title, desc }`

## Code Layout
```
d:/CODE/Test/aarana/
├── package.json
├── vite.config.js
├── eslint.config.js
├── index.html
├── PROJECT.md
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── api/
│   │   ├── adminApi.js
│   │   ├── client.js
│   │   └── liveGameApi.js
│   ├── assets/
│   │   └── aarna.jpg
│   ├── components/
│   │   ├── ApplicationForm.jsx
│   │   ├── HeroVideoBackground.jsx
│   │   ├── PageFlipSection.jsx
│   │   ├── PortfolioDeck.jsx
│   │   ├── PreviousWork.jsx
│   │   ├── ReviewerDashboard.jsx
│   │   └── SiteShell.jsx
│   ├── data/
│   │   └── clubContent.js
│   ├── hooks/
│   │   ├── useIsMobile.js
│   │   └── useTheme.js
│   └── pages/
│       ├── ApplyPage.jsx
│       ├── AudienceDisplayPage.css
│       ├── AudienceDisplayPage.jsx
│       ├── DashboardPage.jsx
│       ├── HomePage.jsx
│       └── admin/
│           ├── AdminDashboardPage.jsx
│           ├── AdminLogin.jsx
│           └── LiveLeaderboardPage.jsx
└── public/
    └── flipcard/
        └── js/
```
