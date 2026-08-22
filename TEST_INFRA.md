# AARNA Test Infrastructure Specification (4-Tier Methodology)

## 1. Executive Summary & Architecture

This document establishes the comprehensive automated testing architecture for the **AARNA Frontend Engineering Refactor & Modernization** platform. The testing harness is designed according to the **4-Tier Verification Methodology**, guaranteeing full opaque-box and functional coverage across all 14 routes, public experiences, reviewer dashboards, super-admin / sub-admin RBAC consoles, real-time live arena broadcast screens, and socket telemetry pipelines.

### Testing Principles
1. **Opaque-Box Behavioral Validation**: Assert observable DOM, network telemetry, routing transitions, and state changes rather than internal implementation details.
2. **Progressive & Deterministic Execution**: Zero flaky network dependencies; simulated and offline mock fallback assertions guarantee deterministic execution in CI/CD and local environments.
3. **Rigorous Responsive & Touch Accessibility Standards**: Rigorous programmatic inspection across 6 viewport breakpoints (`320px`, `375px`, `480px`, `768px`, `1024px`, `1440px`), strict verification of `>= 44x44px` interactive touch targets, and WCAG 2.1 AA a11y standards.
4. **Resilience & Fault Tolerance**: Complete verification of offline fallbacks, socket reconnection loops, corrupted local storage recovery, and unhandled exception prevention.

---

## 2. 4-Tier Test Specification & Verification Matrix

### Tier 1: Feature Coverage (Primary Behavior & Interface Contracts)
*Requirement: >= 5 distinct test assertions per feature module.*

| Feature # | Module Name | Scope & Interface Contracts | Primary Test Assertions |
|---|---|---|---|
| **F1** | 14 Routes Routing Matrix | `src/App.jsx`, `BrowserRouter`, `Routes` | 1. Root route `/` renders `SiteShell` + `HomePage`<br>2. `/apply` renders `SiteShell` + `ApplyPage`<br>3. Wildcard `/*` fallback safely routes to `HomePage`<br>4. Standalone live stage routes (`/display`, `/audience`, `/stage`, `/live-display`) isolate from `SiteShell`<br>5. Standalone admin & host routes (`/admin/login`, `/admin/dashboard`, `/dashboard`, `/admin/live`, `/admin/live-game`, `/live`, `/leaderboard`) route correctly |
| **F2** | Public Experience & SiteShell | `SiteShell.jsx`, `HomePage.jsx`, `HeroVideoBackground.jsx`, `PageFlipSection.jsx`, `PortfolioDeck.jsx`, `PreviousWork.jsx` | 1. Header renders brand logo, title, desktop navigation, and theme toggle<br>2. Hero section mounts video background with poster fallback and typography<br>3. 3D scroll flip section renders all 4 club objectives<br>4. Portfolio deck dynamically loads all 7 club portfolios from `clubContent.js`<br>5. Previous work marquee renders project items with lightbox modal trigger |
| **F3** | Recruitment Form & Notice Timeline | `ApplicationForm.jsx`, `ApplyPage.jsx` | 1. Multi-step progression (Step 0 Details -> Step 1 Context -> Step 2 Direction)<br>2. Step 0 validation (Full Name, College Email regex, 10-digit Phone)<br>3. Step 1 validation (Roll Number, Department, Year 2/3, Section)<br>4. Step 2 validation (Dual distinct portfolio preferences, SOP >= 20 chars)<br>5. Autosave draft persistence and recovery from `localStorage.getItem('aarna_apply_draft')` |
| **F4** | Reviewer Dashboard System | `ReviewerDashboard.jsx`, `DashboardPage.jsx` | 1. Reviewer password authentication gate with `api.createReviewerSession`<br>2. In-memory session token isolation with no public applicant leakage<br>3. Real-time applicant search by name, roll number, and department<br>4. Portfolio domain filter matching applicant preferences<br>5. Read-only applicant detail drawer inspection and sync status telemetry |
| **F5** | Admin Login & RBAC Authentication | `AdminLogin.jsx`, `adminApi.js` | 1. Super-Admin and Sub-Admin credential submission (`POST /login`)<br>2. Storage of JWT bearer token in `aarna_admin_token` and metadata in `aarna_admin_info`<br>3. Handling 401 Unauthorized with token eviction and redirection<br>4. Session recovery via `adminApi.getStoredAdmin`<br>5. Secure logout action clearing tokens and state |
| **F6** | Super Admin & Sub-Admin Dashboard | `AdminDashboardPage.jsx`, `xlsx` export | 1. Role-based view switching (Super Admin tabs vs Sub-Admin applicant review)<br>2. Sub-Admin creation form validation and submission (`POST /create`)<br>3. Applicant review status transitions (`Pending`, `Shortlisted`, `Rejected`, `Hold`)<br>4. Advanced multi-column filtering (Department, Year, Portfolio, Status)<br>5. SheetJS Excel/CSV report generation and download trigger |
| **F7** | Live Arena Stage Screen | `AudienceDisplayPage.jsx`, `AudienceDisplayPage.css` | 1. Projector-optimized broadcast layout without navigation chrome<br>2. Dynamic high-contrast QR code generation via `qrcode` library<br>3. Top-3 Podium visual ranking component with gold/silver/bronze medals<br>4. Real-time round countdown sequencer (`3 -> 2 -> 1 -> GO!`)<br>5. Grand Champion victory modal overlay triggered on game completion |
| **F8** | Host Game Control Console | `LiveLeaderboardPage.jsx`, `liveGameApi.js` | 1. Host security lock protecting game lifecycle controls<br>2. Start round trigger emitting `game_started` socket payload<br>3. Stop round trigger emitting `game_ended` socket payload<br>4. Reset lobby and reset all scores administrative triggers<br>5. Automated CSV leaderboard export with file download creation |
| **F9** | API Services & Mock Fallbacks | `client.js`, `adminApi.js`, `liveGameApi.js`, `clubContent.js` | 1. REST client offline fallback saving applications to `aarana_mock_applications`<br>2. Standalone mock session token generation on network partition<br>3. Admin API auth header injection (`Authorization: Bearer <token>`)<br>4. Socket telemetry event bus (`connect`, `disconnect`, `game_state`, `leaderboard_update`)<br>5. Single source of truth data integrity in `clubContent.js` |

---

### Tier 2: Boundary & Corner Cases
*Requirement: >= 5 distinct boundary tests across layouts, viewports, touch targets, and inputs.*

| Boundary Category | Target Viewport / Input | Verification Criteria |
|---|---|---|
| **B1: Extreme Mobile Viewports** | `320px` (iPhone SE/5), `375px` (iPhone Standard), `480px` (Large Mobile) | `overflow-x: clip` active; zero horizontal body scrollbar; typography scales down cleanly via `clamp()`. |
| **B2: Tablet & Desktop Viewports** | `768px` (iPad Portrait), `1024px` (iPad Landscape / Laptop), `1440px` (Desktop) | Grid column expansion (1 col -> 2 col -> 3 col); desktop navigation renders; mobile drawer toggle hidden. |
| **B3: Touch Target Standards** | All interactive elements (Buttons, Drawer Toggle, Theme Switch, Pills, Close Triggers) | Minimum touch target bounding box `>= 44px x 44px` with adequate click padding. |
| **B4: Extreme & Malformed Input Handling** | Empty strings, 2000+ char strings, Unicode emojis, SQL/XSS metacharacters (`<script>`, `' OR '1'='1`) | Sanitized rendering without crashes; exact error messaging displayed via `role="alert"`. |
| **B5: Empty Data States** | `[]` applicants, `[]` leaderboard players, `[]` sub-admins, empty `localStorage` | Empty state cards with clear user messaging; no `TypeError: Cannot read properties of undefined`. |

---

### Tier 3: Cross-Feature Combinations
*Requirement: Multi-feature state interactions, route transitions, modal escapes, and theme persistence.*

1. **Theme Switching Across Route Transitions**:
   - Toggling light/dark theme sets `document.documentElement.dataset.theme` and updates `localStorage.getItem('aarna-theme')`.
   - Navigating between public routes (`/`, `/apply`) and admin consoles retains consistent theme variables.
2. **Mobile Drawer State & Route Navigation**:
   - Opening mobile drawer locks body scroll (`document.body.style.overflow = 'hidden'`).
   - Clicking a nav link in the drawer closes the drawer, releases body scroll, and navigates to target route.
   - Pressing the `Escape` key closes the drawer and releases body scroll lock.
3. **Modal Focus & Keyboard Escape Handling**:
   - Notice banner modals, Reviewer detail drawers, and Grand Champion modals close on `Escape` key press.
4. **Multi-Criteria Filter Combinations in Admin Tables**:
   - Simultaneous filter combination: `Search: "Rahul"` + `Department: "CSE"` + `Year: "3"` + `Status: "Pending"`.
   - Table displays exact intersection of filters without UI lag.
5. **Token Expiration & 401 Cascade**:
   - Calling protected endpoints with expired/invalid tokens triggers automatic clearance of `aarna_admin_token` and `aarna_admin_info` and redirects user to `/admin/login`.

---

### Tier 4: Real-World Workload Scenarios
*Requirement: Full end-to-end multi-step user and administrative workflows.*

1. **Scenario 1: End-to-End Candidate Application & Reviewer Roster Flow**:
   - Candidate navigates to `/apply`.
   - Fills Step 0 (Name, Email, Phone), Step 1 (Roll Number, Dept, Year, Section), Step 2 (Portfolios, Skills, SOP).
   - Submits application; data is persisted to offline fallback store (`aarana_mock_applications`).
   - Reviewer accesses `/dashboard`, enters reviewer password, searches applicant, inspects detail drawer, and validates SOP.
2. **Scenario 2: Live Arena Event Broadcast & Host Control Cycle**:
   - Host logs into `/admin/live` and unlocks control console.
   - Stage projector displays `/display` with countdown and high-res QR code.
   - Host clicks "Start Round" -> socket broadcasts `game_started` -> countdown fires (`3, 2, 1, GO!`).
   - Score telemetry updates top-3 podium and leaderboard in real time.
   - Host clicks "Stop Round" -> Grand Champion modal triggers with victory sparkles.
   - Host clicks "Export CSV" -> download blob generated and triggered.
3. **Scenario 3: Super-Admin Multi-Department Management & Export Workflow**:
   - Admin logs into `/admin/login`.
   - Accesses `/admin/dashboard`, creates new Sub-Admin for "Designing" department.
   - Switches to Applicants tab, filters by "Technical team", changes status to "Shortlisted".
   - Exports applicant roster to XLSX/CSV spreadsheet.
4. **Scenario 4: Offline Resilience & Network Interruption Handling**:
   - Application boots with simulated network failure.
   - Application submissions gracefully fallback to `localStorage` with `is_mock: true`.
   - Host live view falls back to interval polling without throwing uncaught runtime exceptions.

---

## 3. Test Runner Architecture & Execution

The automated test runner is implemented in native Node.js ESM (`tests/run-e2e.mjs`) leveraging `node:test` and `node:assert`, providing lightning-fast execution (<1.5s), zero external binary dependencies, and structured test reporting.

### Execution Command
```bash
node tests/run-e2e.mjs
```

### Coverage Thresholds
- **Total Test Cases**: >= 75 comprehensive test assertions across 4 tiers.
- **Pass Rate**: 100% required for build readiness.
- **Runtime Errors**: 0 unhandled exceptions.
