# Master Responsive Design QA Report

**Project Target**: AARNA (`d:\CODE\Test\aarana`)  
**Artifact Type**: Master Responsive Design QA Report  
**Author**: Worker 1 (`teamwork_preview_worker`)  
**Source Reports**: Explorer 1 (`inventory_report.md`), Explorer 2 (`static_analysis_1.md`), Explorer 3 (`static_analysis_2.md`)  
**Date**: 2026-08-10  
**Scope**: All 15 JSX/JS/CSS files across Mobile (<640px), Tablet (640px–1024px), and Desktop (>1024px) viewports  

---

## 1. Executive Summary

A comprehensive, multi-phase responsive design QA audit was performed across the AARNA application codebase (`d:\CODE\Test\aarana`). The evaluation synthesized findings from structural inventory, component static analysis, page-level responsive layout checks, routing integration audits, and custom hook reviews across **15 core source files** (`src/index.css`, `SiteShell.jsx`, `ApplicationForm.jsx`, `PortfolioDeck.jsx`, `PageFlipSection.jsx`, `HeroVideoBackground.jsx`, `HomePage.jsx`, `ApplyPage.jsx`, `DashboardPage.jsx`, `ReviewerDashboard.jsx`, `AdminDashboardPage.jsx`, `AdminLogin.jsx`, `App.jsx`, `useIsMobile.js`, `useTheme.js`).

### High-Level Findings Across Viewports:

#### A. Mobile Viewport (<640px)
- **Viewport Height Jitter & Overflow**: Static `100vh` declarations on dynamic containers (`body`, `.site-shell`, `PageFlipSection`) interact poorly with mobile browser UI address bars (Chrome/Safari), causing noticeable height jumping during scroll. Furthermore, `overflow: hidden` on `.site-shell` clips modal footers, reset buttons on form completion states, and vertical mobile drawer links in short or landscape phone viewports.
- **Fixed Dimensions & Text Clipping**: Fixed pixel heights (`height: 480px` on `.member-intro-card`, `min-height: 290px` on `.portfolio-card`) combined with non-fluid typography cause text wrapping to overflow container bounds, resulting in text cutoffs.
- **Touch Gesture Conflicts**: On touch devices, horizontal card swipe gestures in `PortfolioDeck.jsx` conflict with vertical page scrolling, resulting in scroll stutter.
- **Admin Suite Mobile Deficits**: `AdminDashboardPage.jsx` renders a 6-column HTML table without a mobile card fallback view, forcing compulsory horizontal scrolling. Stat cards (`minmax(220px, 1fr)`) stack into 4 tall vertical blocks, pushing data tables off-screen.

#### B. Tablet Viewport (640px–1024px)
- **The "769px–1024px Gap"**: Media query breakpoints across the codebase jump directly from `<=768px` to default desktop styles without accommodating tablet portrait and small laptop viewports (769px–1024px).
- **Header & Filter Collisions**: `.site-header` retains `.desktop-nav` links up to 768px, causing navigation items, brand mark, and theme toggle to collide on 800px–1024px screens. Filter bars (`.reviewer-filters`) squeeze search inputs to <200px.
- **3D Transform Performance**: `PageFlipSection.jsx` and 3D card tilt effects execute expensive WebGL/Framer Motion transforms on tablet screens (769px–1024px) because fallback thresholds are set strictly to `<=768px`.
- **Data Table Scroll Barrier**: `ReviewerDashboard.jsx` forces desktop table layout on 769px–1024px viewports (`.desktop-only-table`), requiring tablet users to horizontally scroll back and forth to inspect sync statuses.

#### C. Desktop Viewport (>1024px)
- **Sticky Scroll Invalidation**: `overflow: hidden` on `.site-shell` breaks CSS specification compliance for `position: sticky`, disabling sticky scroll calculations in `PageFlipSection.jsx`.
- **Viewport Width Overflows**: Usage of `width: 100vw` on `.hero-video-container` creates horizontal scrollbars on Windows OS desktop browsers where vertical scrollbars consume 17px of layout width.
- **Modal Content Lockout**: `.portfolio-expanded-card` locks height to `min(800px, 90vh)` with `overflow: hidden` and missing `overflow-y: auto` on `.member-right-col`, permanently clipping >400px of member biography, experience, and project content.
- **Asymmetrical Form Grids**: 3-field input groups in 2-column form grids (`.form-grid`) leave empty layout holes in row 2 column 2.

---

## 2. Complete Inventory of Analyzed CSS/JSX Files & Components

All 15 source files in the project were inventoried and audited for responsive layout compliance:

| # | File Path | Type | Purpose & Scope | Responsive / Breakpoint Responsibilities |
|---|---|---|---|---|
| 1 | `src/main.jsx` | JSX Entry | Mounts `App` to DOM root element | Entry point rendering wrapper |
| 2 | `src/App.jsx` | JSX Component | Top-level router, ScrollToTop, backend wakeup, `SiteShell` wrapper | Theme state management, route matching, site shell integration |
| 3 | `src/index.css` | CSS Stylesheet | Project-wide styling system, CSS design tokens, utility classes, themes | Implements 3-breakpoint media query system (`1024px`, `768px`, `480px`), reduced-motion accessibility |
| 4 | `src/components/SiteShell.jsx` | JSX Component | Universal layout shell wrapper (Header, Desktop Nav, Theme Toggle, Mobile Drawer, Footer) | Header viewport bounds, mobile navigation drawer with body scroll lock, responsive footer flexbox |
| 5 | `src/components/ApplicationForm.jsx` | JSX Component | 3-step recruitment application form with draft auto-save/restore and live validation | 2-column desktop grid to 1-column mobile grid, step animation variants, mobile progress bar |
| 6 | `src/components/HeroVideoBackground.jsx` | JSX Component | Hero background video player with overlay gradient & control buttons | Absolute positioning backdrop spanning viewport behind header, video controls overlay |
| 7 | `src/components/PageFlipSection.jsx` | JSX Component | Scroll-driven section wrapper applying 3D page-flip transforms | Sticky positioning scroll space, mobile fallback stack (`<=768px`), reduced motion fallback |
| 8 | `src/components/PortfolioDeck.jsx` | JSX Component | 7-team interactive portfolio deck with 3D member tilt modal cards | Card stack scaling, drag gesture handling, modal portal, expanded member details inspector |
| 9 | `src/components/ReviewerDashboard.jsx` | JSX Component | Private reviewer workspace, authentication, sync summary, filterable applications | Switches between `.desktop-only-table` and `.mobile-only-cards`, mobile filter drawer |
| 10 | `src/pages/HomePage.jsx` | JSX Page | Main landing page showcasing Hero, Story, Beliefs, Portfolios, Objectives, CTA | Section wrappers (`PageFlipSection`), 2-column section grids, responsive hero copy |
| 11 | `src/pages/ApplyPage.jsx` | JSX Page | Application route container wrapping `ApplicationForm` and data privacy note | Section wrapper layout with conditional submitted state flexbox center |
| 12 | `src/pages/DashboardPage.jsx` | JSX Page | Reviewer dashboard route wrapper | Section wrapper container for `ReviewerDashboard` |
| 13 | `src/pages/admin/AdminDashboardPage.jsx` | JSX Page | Comprehensive admin dashboard for Super Admins and Sub-Admins | Responsive stats grid, applicant data table, sub-admin management forms, drawer modal |
| 14 | `src/pages/admin/AdminLogin.jsx` | JSX Page | Admin portal authentication form card | Centered backdrop card container with responsive padding |
| 15 | `src/hooks/useIsMobile.js` | JS Custom Hook | Window width listener returning boolean status relative to breakpoint (default 768px) | Provides dynamic JS state for mobile layout conditional rendering |

---

## 3. Dynamic Element Checklist

The codebase features 11 major dynamic layout element categories across components:

1. **Hero Sections**:
   - `src/components/HeroVideoBackground.jsx`: `.hero-video-container`, `.hero-video`, `.hero-video-overlay`, `.hero-video-controls`, `.video-ctrl-btn`
   - `src/pages/HomePage.jsx`: `.hero-section`, `.hero-copy`, `.announcement`, `.hero-eyebrow`, `h1`, `.hero-intro`, `.hero-actions`, `.hero-orbit`

2. **Navigation Bar / Header**:
   - `src/components/SiteShell.jsx`: `.site-header`, `.brand`, `.brand-mark`, `.site-nav.desktop-nav`, `.header-actions`, `ThemeToggle`, `.mobile-menu-toggle`

3. **Footers**:
   - `src/components/SiteShell.jsx`: `.site-footer` (copyright & tagline with responsive flex direction)

4. **Modals / Dialogs / Drawers / Slide-Overs**:
   - `src/components/SiteShell.jsx`: `.mobile-drawer-backdrop`, `.mobile-drawer`, `.mobile-drawer-header`, `.mobile-drawer-links`, `.mobile-drawer-footer`
   - `src/components/PortfolioDeck.jsx`: `ModalPortal`, `.portfolio-modal-backdrop`, `.portfolio-expanded-card`, `.member-left-col`, `.member-right-col`
   - `src/components/ReviewerDashboard.jsx`: `.drawer-backdrop`, `.application-drawer`
   - `src/pages/admin/AdminDashboardPage.jsx`: Fixed applicant profile detail drawer modal (`.selectedApplicant`)

5. **Forms & Inputs**:
   - `src/components/ApplicationForm.jsx`: `.application-form`, `.form-progress`, `FormField` (`input`, `select`, `textarea`), `.form-grid`, `.form-grid-single`, `.form-actions`, `.form-alert`
   - `src/components/ReviewerDashboard.jsx`: `DashboardLogin` form, `.reviewer-filters`, `.search-control`
   - `src/pages/admin/AdminLogin.jsx`: Admin login form card with roll number and password inputs
   - `src/pages/admin/AdminDashboardPage.jsx`: Sub-admin creation form with roll number, password, department, and section inputs

6. **Sidebars & Navigation Drawers**:
   - `src/components/SiteShell.jsx`: `.mobile-drawer` (slide-in mobile menu navigation)
   - `src/components/ReviewerDashboard.jsx`: `.application-drawer` (slide-in application detail inspector)
   - `src/pages/admin/AdminDashboardPage.jsx`: Slide-in profile detail sidebar modal

7. **Cards & Content Containers**:
   - `src/pages/HomePage.jsx`: `.belief-card`, `.belief-card-accent`, `.cta-section`
   - `src/components/PortfolioDeck.jsx`: `.portfolio-card`, `MemberCardTilt`, `.member-intro-card`
   - `src/components/ReviewerDashboard.jsx`: `DashboardLogin` container, `.sync-summary` stat cards, `.reviewer-applicant-card` (mobile table replacement card)
   - `src/pages/admin/AdminDashboardPage.jsx`: Stat overview cards, sub-admin info cards
   - `src/pages/admin/AdminLogin.jsx`: Centered login container card

8. **Data Tables**:
   - `src/components/ReviewerDashboard.jsx`: `.reviewer-table-wrap`, `.reviewer-table.desktop-only-table`
   - `src/pages/admin/AdminDashboardPage.jsx`: Applicants data table (`overflowX: 'auto'`)

9. **Grid Layouts**:
   - `src/pages/HomePage.jsx`: `.hero-section` (2-col grid), `.story-section` (2-col grid), `.belief-grid` (2-col grid), `.objective-section` (2-col grid)
   - `src/components/ApplicationForm.jsx`: `.form-grid` (2-col grid), `.form-grid-single` (1-col grid)
   - `src/components/PortfolioDeck.jsx`: `.competency-grid` (auto-fill responsive grid)
   - `src/components/ReviewerDashboard.jsx`: `.sync-summary` (3-col grid), `.reviewer-filters` (5-col grid), `.applicant-card-details` (3-col grid)
   - `src/pages/admin/AdminDashboardPage.jsx`: Overview stat grid (`repeat(auto-fit, minmax(220px, 1fr))`), Sub-admin grid (`repeat(auto-fit, minmax(320px, 1fr))`)

10. **Buttons & Action Elements**:
    - `src/components/SiteShell.jsx`: `.theme-toggle`, `.mobile-menu-toggle`, `.mobile-drawer-close`
    - `src/pages/HomePage.jsx`: `.button-primary`, `.button-quiet`, `.read-more-toggle`
    - `src/components/PortfolioDeck.jsx`: `.portfolio-tabs button`, `.deck-controls button`, `.member-back-nav`, `.member-arrows button`
    - `src/components/ApplicationForm.jsx`: `.button-primary`, `.button-quiet`, `.form-actions button`
    - `src/components/ReviewerDashboard.jsx`: `.mobile-filter-toggle`, action buttons
    - `src/pages/admin/AdminDashboardPage.jsx`: Sign Out button, View Details buttons, Create Sub-Admin button

11. **Viewport & Scroll Containers**:
    - `src/components/SiteShell.jsx`: `.site-shell`
    - `src/components/PageFlipSection.jsx`: Sticky scroll viewport container with negative margin page stack effect
    - `src/index.css`: `.section-wrap` (central viewport width constraint)

---

## 4. In-Depth `SiteShell.jsx` & Main Container Viewport Analysis

### A. SiteShell Architectural Design
`SiteShell.jsx` wraps all top-level application routes and establishes global layout constraints:

```jsx
<div className="site-shell">
  <header className="site-header"> ... </header>
  <AnimatePresence>
    {isMobileMenuOpen && ( <motion.nav className="mobile-drawer"> ... </motion.nav> )}
  </AnimatePresence>
  <main>{children}</main>
  <footer className="site-footer"> ... </footer>
</div>
```

#### Key Styling Rules (`src/index.css`):
- **`.site-shell`**:
  - `min-height: 100vh`: Intended to stretch shell to full viewport height. (Defect: `100vh` causes mobile browser navigation bar jumps; should be `100dvh`).
  - `overflow: hidden`: Intended to clip horizontal transform bleed. (Defect: `overflow: hidden` breaks `position: sticky` specification compliance; should be `overflow-x: clip`).

### B. Header Container Structure (`.site-header`)
- **Desktop Formula**: `width: min(1200px, calc(100% - 48px)); min-height: 82px; margin: 0 auto;`
- **Flexbox Mechanics**: `display: flex; align-items: center; justify-content: space-between; gap: 22px;`
- **Breakpoint Dynamics**:
  - **Desktop (>1024px)**: Full brand mark, 3 desktop nav links, theme toggle, and CTA button rendered inline.
  - **Tablet Gap (769px–1024px)**: Header width shrinks to `calc(100% - 48px)`, but `.desktop-nav` remains visible (`display: flex`). Brand mark, links, and action buttons collide on screens <1000px.
  - **Mobile (<=768px)**: `@media (max-width: 768px)` sets `.desktop-nav { display: none !important; }` and `.mobile-menu-toggle { display: inline-flex !important; }`. Width shifts to `width: min(100% - 32px, 1120px)`.
  - **Small Mobile (<=480px)**: Width shifts to `width: min(100% - 24px, 1120px)`. Brand subtitle (`.brand small`) hides (`display: none`).

### C. Mobile Navigation Drawer (`.mobile-drawer`)
- **Scroll Lock**: Sets `document.body.style.overflow = 'hidden'` on open.
- **Positioning**: `position: fixed; top: 0; right: 0; bottom: 0; z-index: 9999; width: min(340px, 85vw);`
- **Defect**: Lacks `max-height: 100dvh` and `overflow-y: auto`, clipping bottom content on short screens.

### D. Main Section Container Wrappers (`.section-wrap`)
The main content container across all pages is governed by `.section-wrap`:

```css
.section-wrap {
  width: min(1120px, calc(100% - 48px));
  margin-inline: auto;
}
```

#### Breakpoint Analysis Matrix for `.section-wrap`:

| Viewport Range | Width Formula / Constraint | Side Margins / Padding | Multi-Column Behavior |
|---|---|---|---|
| **Desktop (>1024px)** | `width: min(1120px, calc(100% - 48px))` | 24px margins each side | 2-column grids (Hero 1.1fr / 0.7fr, Story 1fr / 1fr, Objective 0.75fr / 1.25fr, Form 2-col, Table view) |
| **Tablet Landscape (769px - 1024px)** | `width: min(1120px, calc(100% - 48px))` | 24px margins each side | Grids stay multi-column, reducing gap (Hero gap 80px -> 40px). Text copy squishes in narrow columns. |
| **Tablet Portrait / Mobile (481px - 768px)** | `width: min(100% - 32px, 1120px)` | 16px margins each side | Media query `<=768px` stacks grids to 1 column (`grid-template-columns: 1fr`). Desktop table switches to cards. |
| **Small Mobile (<480px)** | `width: min(100% - 24px, 1120px)` | 12px margins each side | Buttons widen to 100% width, hero action flex direction switches to column, footer flex direction switches to column. |

---

## 5. Comprehensive Layout Flaws & Code Breakdown

A total of **41 detailed layout flaws** were identified across all 15 analyzed source files. Each flaw is documented below with its ID, file path, line numbers, exact code snippet, breakpoint impact, and best-practice fix:

---

### Group 1: Global Styling System & Shell Container (`src/index.css`, `SiteShell.jsx`)

#### FLAW-01: Root Shell Overflow Constraint Breaks Sticky Scroll & Causes Mobile Viewport Jitter
- **Component**: `SiteShell` / CSS Root (`src/index.css`)
- **File Path**: `src/index.css`
- **Line Numbers**: 50–52, 64
- **Exact Code Snippet**:
  ```css
  body {
    min-width: 320px;
    min-height: 100vh;
    ...
  }
  .site-shell { min-height: 100vh; overflow: hidden; }
  ```
- **Breakpoint Impact**:
  - **Mobile (<640px)**: `100vh` includes browser address bars on mobile Chrome/Safari, causing layout height jumps when scrolling.
  - **Tablet (640px–1024px) & Desktop (>1024px)**: `overflow: hidden` on `.site-shell` breaks CSS `position: sticky` specification for child components like `PageFlipSection.jsx`.
- **CSS Best-Practice Fix**:
  ```css
  body {
    min-width: 320px;
    min-height: 100dvh;
    margin: 0;
  }
  .site-shell {
    min-height: 100dvh;
    overflow-x: clip; /* Replaces overflow: hidden to allow position: sticky while preventing horizontal bleed */
  }
  ```

---

#### FLAW-02: Header Desktop Navigation & Actions Collision on Tablet Viewports (769px–1024px Gap)
- **Component**: `SiteShell` / Desktop Header (`src/index.css`)
- **File Path**: `src/index.css`
- **Line Numbers**: 66–76, 92–95, 912–917
- **Exact Code Snippet**:
  ```css
  .site-header {
    width: min(1200px, calc(100% - 48px));
    min-height: 82px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 22px;
    margin: 0 auto;
  }
  @media (max-width: 768px) {
    .desktop-nav { display: none !important; }
    .mobile-menu-toggle { display: inline-flex !important; }
  }
  ```
- **Breakpoint Impact**:
  - **Mobile (<640px)**: Mobile menu active (`.desktop-nav` hidden).
  - **Tablet (769px–1024px)**: `.desktop-nav` is STILL VISIBLE while header width shrinks to `calc(100% - 48px)`. Brand mark, 3 nav links, theme toggle, and action buttons collide and force items to wrap awkwardly.
  - **Desktop (>1024px)**: Fits comfortably.
- **CSS Best-Practice Fix**:
  ```css
  @media (max-width: 1024px) {
    .desktop-nav { display: none !important; }
    .mobile-menu-toggle { display: inline-flex !important; }
  }
  ```

---

#### FLAW-03: Unhandled Vertical Overflow in Mobile Navigation Drawer
- **Component**: `SiteShell` / Mobile Drawer (`src/index.css`)
- **File Path**: `src/index.css`
- **Line Numbers**: 133–146
- **Exact Code Snippet**:
  ```css
  .mobile-drawer {
    position: fixed; top: 0; right: 0; bottom: 0; z-index: 9999;
    width: min(340px, 85vw); display: flex; flex-direction: column;
    justify-content: space-between;
    padding: max(24px, env(safe-area-inset-top)) 24px max(24px, env(safe-area-inset-bottom)) 24px;
    background: var(--surface-raised); box-shadow: -10px 0 40px rgba(0, 0, 0, 0.3);
  }
  ```
- **Breakpoint Impact**:
  - **Mobile (<640px)**: On short phone screens or landscape orientation (<500px height), drawer elements exceed available height. Lacking `overflow-y: auto`, lower links and copyright footer are permanently clipped off-screen.
- **CSS Best-Practice Fix**:
  ```css
  .mobile-drawer {
    max-height: 100dvh;
    overflow-y: auto;
  }
  ```

---

#### FLAW-04: Hardcoded Inline Styles on Brand Logo Image
- **Component**: `SiteShell.jsx`
- **File Path**: `src/components/SiteShell.jsx`
- **Line Number**: 47
- **Exact Code Snippet**:
  ```jsx
  <img src="/Logo.png" alt="AARNA Logo" className="brand-logo-img" style={{ width: 32, height: 32, objectFit: 'contain' }} />
  ```
- **Breakpoint Impact**: All Breakpoints (Mobile, Tablet, Desktop): Hardcodes `width: 32, height: 32` inline JSX style, overriding stylesheet rules and CSS variables.
- **CSS Best-Practice Fix**: Remove inline style attribute and define in CSS:
  ```css
  .brand-logo-img {
    width: clamp(28px, 3.5vw, 34px);
    height: auto;
    object-fit: contain;
  }
  ```

---

#### FLAW-05: Hardcoded Hex Color on Drawer Brand Mark Breaking Dark Mode
- **Component**: `SiteShell.jsx`
- **File Path**: `src/components/SiteShell.jsx`
- **Line Number**: 98
- **Exact Code Snippet**:
  ```jsx
  <span className="brand-mark" style={{ background: '#513369', borderRadius: '50%' }}></span>
  ```
- **Breakpoint Impact**: All Breakpoints (when mobile drawer is active): Hardcodes `#513369` background directly in JSX inline style, ignoring CSS design tokens (`var(--violet)`).
- **CSS Best-Practice Fix**: Remove inline style prop and rely on standard `.brand-mark` CSS class.

---

### Group 2: Landing Page & Hero Components (`HomePage.jsx`, `HeroVideoBackground.jsx`, `PageFlipSection.jsx`)

#### FLAW-06: Hero Background Video Container Horizontal Scrollbar caused by `100vw`
- **Component**: `HeroVideoBackground.jsx` / `src/index.css`
- **File Path**: `src/components/HeroVideoBackground.jsx` & `src/index.css`
- **Line Numbers**: `HeroVideoBackground.jsx:38-53`, `index.css:209-220`
- **Exact Code Snippet**:
  ```css
  .hero-video-container {
    position: absolute; top: -82px; bottom: 0; left: 50%;
    width: 100vw; transform: translateX(-50%); overflow: hidden;
  }
  ```
- **Breakpoint Impact**:
  - **Desktop (>1024px)**: `width: 100vw` on `.hero-video-container` causes horizontal page scrollbars on Windows OS desktop browsers where vertical scrollbars consume 17px layout width.
- **CSS Best-Practice Fix**:
  ```css
  .hero-video-container {
    width: 100%;
    max-width: 100dvw;
    left: 0;
    transform: none;
  }
  ```

---

#### FLAW-07: Hero Section Grid Squeezing on Tablet Breakpoint (640px–1024px)
- **Component**: `HomePage.jsx` / `src/index.css`
- **File Path**: `src/pages/HomePage.jsx` & `src/index.css`
- **Line Numbers**: `HomePage.jsx:43-77`, `index.css:200-208, 900`
- **Exact Code Snippet**:
  ```css
  .hero-section {
    position: relative; display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(300px, 0.7fr);
    align-items: center; min-height: calc(100vh - 84px); gap: 80px; padding-block: 40px;
  }
  @media (max-width: 1024px) { .hero-section { gap: 40px; } }
  ```
- **Breakpoint Impact**:
  - **Tablet (640px–1024px)**: Between 769px and 1024px, 2-column grid is maintained. On a 768px tablet container (~720px width), `minmax(300px, 0.7fr)` forces orbit column to take at least 340px, leaving only ~380px for copy column. Text squeezes into narrow vertical stacks.
- **CSS Best-Practice Fix**:
  ```css
  @media (max-width: 1024px) {
    .hero-section {
      grid-template-columns: 1fr;
      gap: 32px;
      min-height: auto;
    }
  }
  ```

---

#### FLAW-08: Fixed Pixel Absolute Offsets in Hero Orbit Badges (`src/index.css`)
- **Component**: `HomePage.jsx` / `src/index.css`
- **File Path**: `src/index.css`
- **Line Numbers**: 299, 305–306
- **Exact Code Snippet**:
  ```css
  .hero-orbit span:nth-child(1) { top: 33px; left: 50%; transform: translateX(-50%); }
  .hero-orbit span:nth-child(2) { right: 6px; bottom: 94px; transform: rotate(68deg); }
  .hero-orbit span:nth-child(3) { left: 13px; bottom: 96px; transform: rotate(-68deg); }
  ```
- **Breakpoint Impact**:
  - **Mobile (<640px)** & **Tablet (640px–1024px)**: Orbit container shrinks (`min(280px, 75vw)`), but child badges use fixed pixel values (`top: 33px`, `bottom: 94px`). On small phones (240px orbit width), text badges overlap center logo emblem or bleed outside ring.
- **CSS Best-Practice Fix**:
  ```css
  .hero-orbit span:nth-child(1) { top: 8%; left: 50%; transform: translateX(-50%); }
  .hero-orbit span:nth-child(2) { right: 4%; bottom: 26%; transform: rotate(68deg); }
  .hero-orbit span:nth-child(3) { left: 4%; bottom: 26%; transform: rotate(-68deg); }
  ```

---

#### FLAW-09: Orbit Emblems Hardcoded Dimensions in `HomePage.jsx` JSX Structure
- **Component**: `HomePage.jsx`
- **File Path**: `src/pages/HomePage.jsx` & `src/index.css`
- **Line Numbers**: `HomePage.jsx:63-76`, `index.css:299-306, 927-930`
- **Exact Code Snippet**:
  ```css
  .hero-orbit strong { display: grid; width: 104px; height: 104px; place-items: center; ... }
  ```
- **Breakpoint Impact**:
  - **Mobile (<640px)**: Central logo emblem has fixed `104px` width/height. When orbit container shrinks to 240px on small screens, emblem takes >43% of diameter, crowding text labels.
- **CSS Best-Practice Fix**:
  ```css
  .hero-orbit strong {
    width: clamp(80px, 28vw, 104px);
    height: clamp(80px, 28vw, 104px);
  }
  ```

---

#### FLAW-10: Unwrapped Hero Action Buttons on Phablet Breakpoints (481px–768px)
- **Component**: `HomePage.jsx` / `src/index.css`
- **File Path**: `src/pages/HomePage.jsx` & `src/index.css`
- **Line Numbers**: `HomePage.jsx:58-61`, `index.css:289, 1089-1096`
- **Exact Code Snippet**:
  ```css
  .hero-actions, .form-actions { display: flex; align-items: center; gap: 12px; margin-top: 32px; }
  @media (max-width: 480px) { .hero-actions { flex-direction: column; width: 100%; gap: 10px; } }
  ```
- **Breakpoint Impact**:
  - **Mobile Landscape / Phablet (481px–768px)**: Flexbox lacks `flex-wrap: wrap`. Responsive column stacking ONLY kicks in at `<= 480px`. Between 481px and 768px, horizontal action buttons overflow container width.
- **CSS Best-Practice Fix**:
  ```css
  .hero-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
  @media (max-width: 640px) {
    .hero-actions { flex-direction: column; width: 100%; }
    .hero-actions .button { width: 100%; }
  }
  ```

---

#### FLAW-11: Fixed Min-Height and `overflow: hidden` Content Truncation in Portfolio Cards
- **Component**: `HomePage.jsx` / `src/index.css`
- **File Path**: `src/pages/HomePage.jsx` & `src/index.css`
- **Line Numbers**: `HomePage.jsx:113-121`, `index.css:330, 966-969`
- **Exact Code Snippet**:
  ```css
  .portfolio-card { min-height: 310px; padding: clamp(24px, 5vw, 60px); overflow: hidden; border-radius: 25px; }
  @media (max-width: 768px) { .portfolio-card { min-height: 290px; padding: 24px 20px; } }
  ```
- **Breakpoint Impact**:
  - **Mobile (<640px)** & **Tablet (640px–1024px)**: `h3` titles wrapping onto 3 lines combined with body text exceed 290px/310px height. Because `.portfolio-card` sets `overflow: hidden`, lower lines and action tags are cut off.
- **CSS Best-Practice Fix**:
  ```css
  .portfolio-card {
    min-height: auto;
    height: 100%;
    padding: clamp(20px, 4vw, 48px);
    overflow: visible;
  }
  ```

---

#### FLAW-12: Non-Fluid Objective Section List Layout on Tablet (640px–1024px)
- **Component**: `HomePage.jsx` / `src/index.css`
- **File Path**: `src/pages/HomePage.jsx` & `src/index.css`
- **Line Numbers**: `HomePage.jsx:124-139`, `index.css:347, 902, 1000-1009`
- **Exact Code Snippet**:
  ```css
  .objective-section { display: grid; grid-template-columns: 0.75fr 1.25fr; gap: 9vw; padding-block: 100px; }
  .objective-list li { display: grid; grid-template-columns: 52px 1fr; gap: 16px; font-size: 1.04rem; }
  ```
- **Breakpoint Impact**:
  - **Tablet (640px–1024px)**: Between 769px and 1024px, column width narrows (`0.8fr 1.2fr`), but `font-size: 1.04rem` and `52px` number column are static. Content in 400px space wraps into 5 tightly stacked lines.
- **CSS Best-Practice Fix**:
  ```css
  .objective-list li {
    font-size: clamp(0.92rem, 1.1vw, 1.04rem);
    grid-template-columns: clamp(36px, 5vw, 52px) 1fr;
  }
  ```

---

#### FLAW-13: Sticky Positioning Failure due to `.site-shell` `overflow: hidden`
- **Component**: `PageFlipSection.jsx`
- **File Path**: `src/components/PageFlipSection.jsx`
- **Line Numbers**: 90–96
- **Exact Code Snippet**:
  ```jsx
  <div style={{ position: 'sticky', bottom: 0, width: '100%', perspective: '1500px' }}>
  ```
- **Breakpoint Impact**:
  - **Desktop (>1024px)** & **Tablet (769px–1024px)**: `position: sticky` fails because parent ancestor `.site-shell` applies `overflow: hidden` (`index.css:64`), breaking 3D page flip scroll calculations.
- **CSS Best-Practice Fix**: Change `.site-shell { overflow: hidden; }` to `overflow-x: clip;`.

---

#### FLAW-14: Tablet Viewport (769px–1024px) Fallback Gap in `PageFlipSection`
- **Component**: `PageFlipSection.jsx`
- **File Path**: `src/components/PageFlipSection.jsx`
- **Line Numbers**: 8, 62–74
- **Exact Code Snippet**:
  ```javascript
  const isMobile = useIsMobile(768)
  ```
- **Breakpoint Impact**:
  - **Tablet (640px–1024px, specifically 769px–1024px)**: Mobile fallback triggers only at <=768px. Tablet touch screens (e.g. iPad 820px) execute heavy Framer Motion 3D scroll transforms, causing touch scroll stutter and layout height jumps.
- **CSS Best-Practice Fix**: Update fallback threshold to 1024px (`useIsMobile(1024)`).

---

#### FLAW-15: Static `100vh` Padding/Margin vs Dynamic Mobile Viewports (`100dvh`)
- **Component**: `PageFlipSection.jsx`
- **File Path**: `src/components/PageFlipSection.jsx`
- **Line Numbers**: 85–86
- **Exact Code Snippet**:
  ```javascript
  paddingBottom: isLast ? '0' : '100vh',
  marginBottom: isLast ? '0' : '-100vh',
  ```
- **Breakpoint Impact**:
  - **All Viewports (especially Mobile <640px)**: Uses static `'100vh'` instead of dynamic `'100dvh'`, causing unexpected extra scroll gaps when browser UI navigation bars expand or collapse.
- **CSS Best-Practice Fix**: Use `'100dvh'` for viewport height calculations.

---

#### FLAW-16: Missing Focal Point Adjustment for 16:9 Video on Mobile Portrait Viewports
- **Component**: `HeroVideoBackground.jsx` / `src/index.css`
- **File Path**: `src/components/HeroVideoBackground.jsx` & `src/index.css`
- **Line Numbers**: `HeroVideoBackground.jsx:39-50`, `index.css:224`
- **Exact Code Snippet**:
  ```css
  .hero-video { width: 100%; height: 100%; object-fit: cover; }
  ```
- **Breakpoint Impact**:
  - **Mobile (<640px)**: On tall mobile portrait screens, landscape 16:9 video gets heavily cropped on sides without focal point alignment (`object-position: center`), cutting off subjects.
- **CSS Best-Practice Fix**: Add `object-position: center center;` and responsive aspect-ratio handling.

---

#### FLAW-17: Unanchored Video Controls Overlay on Small Mobile Screens
- **Component**: `HeroVideoBackground.jsx` / `src/index.css`
- **File Path**: `src/components/HeroVideoBackground.jsx` & `src/index.css`
- **Line Numbers**: `index.css:234-249`
- **Exact Code Snippet**:
  ```css
  .hero-video-controls { position: absolute; bottom: 24px; right: 32px; z-index: 10; }
  ```
- **Breakpoint Impact**:
  - **Mobile (<640px, <480px)**: Controls stay at `right: 32px; bottom: 24px;`. On small phones (<480px), controls overlap hero text content or orbit graphics.
- **CSS Best-Practice Fix**: Add `@media (max-width: 640px) { .hero-video-controls { bottom: 12px; right: 16px; scale: 0.9; } }`.

---

### Group 3: Application Form & Apply Route (`ApplyPage.jsx`, `ApplicationForm.jsx`)

#### FLAW-18: Height Collapse & Layout Shift on Desktop Step Animations in Form
- **Component**: `ApplicationForm.jsx`
- **File Path**: `src/components/ApplicationForm.jsx`
- **Line Numbers**: 82, 240–285
- **Exact Code Snippet**:
  ```javascript
  const cardVariants = { exit: (dir) => ({ position: 'absolute', top: 0, left: 0, right: 0 }) }
  ```
- **Breakpoint Impact**:
  - **Desktop (>1024px)** & **Tablet (769px–1024px)**: `cardVariants` applies `position: 'absolute'` on exiting step inside container with `overflow: hidden`. Shorter step transitioning to longer step causes container height to collapse mid-animation.
- **CSS Best-Practice Fix**: Wrap step transitions in `AnimatePresence mode="wait"` or use Framer Motion `layout="height"`.

---

#### FLAW-19: Asymmetrical Form Grid Layout for 3-Field Form Steps (Step 1)
- **Component**: `ApplicationForm.jsx`
- **File Path**: `src/components/ApplicationForm.jsx`
- **Line Numbers**: 341–351
- **Exact Code Snippet**:
  ```jsx
  <div className="form-grid">
    <FormField label="Full name" ... />
    <FormField label="College email" ... />
    <FormField label="Phone number" ... />
  </div>
  ```
- **Breakpoint Impact**:
  - **Desktop (>1024px)** & **Tablet (640px–1024px)**: Step 1 contains 3 fields in `.form-grid` (`repeat(2, minmax(0, 1fr))`). 3 fields leave an empty slot in row 2 column 2.
- **CSS Best-Practice Fix**: Target 3rd child to span full grid row: `.form-grid > .form-field:nth-child(3):last-child { grid-column: 1 / -1; }`.

---

#### FLAW-20: JS vs CSS Breakpoint Mismatch in `useIsMobile(768)` Hook
- **Component**: `ApplicationForm.jsx` / `useIsMobile.js`
- **File Path**: `src/components/ApplicationForm.jsx`
- **Line Number**: 82
- **Exact Code Snippet**:
  ```javascript
  const isMobile = useIsMobile(768)
  ```
- **Breakpoint Impact**:
  - **Tablet (640px–1024px)**: React hook checks `768px` for JS animations while CSS rules shift layout at `1024px` and `480px`. Near 768px, JS state mismatch causes 3D perspective transforms to execute while CSS renders a 1-column mobile layout.
- **CSS Best-Practice Fix**: Synchronize JS hook threshold constants with CSS media query breakpoints (`1024px` or `640px`).

---

#### FLAW-21: Disconnected Floating Step Markers on Mobile Form Progress Bar
- **Component**: `ApplicationForm.jsx` / `src/index.css`
- **File Path**: `src/components/ApplicationForm.jsx` & `src/index.css`
- **Line Numbers**: `ApplicationForm.jsx:289-319`, `index.css:363-369, 1023-1025`
- **Exact Code Snippet**:
  ```css
  @media (max-width: 768px) { .form-progress li .step-label-text { display: none; } }
  ```
- **Breakpoint Impact**:
  - **Mobile (<640px)**: At `<= 768px`, `.step-label-text` is hidden. Because `.form-progress li` retains `flex: 1`, 3 small circles (`25px`) spread apart across form width with no connecting timeline track line, looking orphaned.
- **CSS Best-Practice Fix**: Add a pseudo-element connecting track line (`.form-progress::before`) behind step markers.

---

#### FLAW-22: Uneven 2-Column Grid Layout Holes in Step 3 Form Preferences
- **Component**: `ApplicationForm.jsx` / `src/index.css`
- **File Path**: `src/components/ApplicationForm.jsx` & `src/index.css`
- **Line Numbers**: `ApplicationForm.jsx:383-406`, `index.css:371`
- **Exact Code Snippet**:
  ```jsx
  <div className="form-grid">
    <FormField label="First portfolio preference" ... />
    <FormField label="Second portfolio preference" ... />
    <FormField label="Skills" ... />
  </div>
  ```
- **Breakpoint Impact**:
  - **Desktop (>1024px)** & **Tablet (640px–1024px)**: Preference inputs in Step 3 leave Column 2 of Row 2 blank, creating an asymmetrical empty hole.
- **CSS Best-Practice Fix**: Add `.form-grid > .form-field:nth-child(3):last-child { grid-column: 1 / -1; }`.

---

#### FLAW-23: Unhandled Viewport Overflow on Submission Success State in Short Viewports
- **Component**: `ApplyPage.jsx` / `ApplicationForm.jsx` / `src/index.css`
- **File Path**: `src/pages/ApplyPage.jsx` & `src/components/ApplicationForm.jsx` & `src/index.css`
- **Line Numbers**: `ApplyPage.jsx:8`, `ApplicationForm.jsx:214-236`, `index.css:353, 371`
- **Exact Code Snippet**:
  ```css
  .apply-page.is-submitted { min-height: calc(100vh - 140px); padding-block: 40px; }
  .submission-success { max-width: 720px; padding: 64px 30px; ... }
  ```
- **Breakpoint Impact**:
  - **Mobile (<640px)** & **Short Viewports (<600px height)**: `min-height: calc(100vh - 140px)` combined with `padding: 64px 30px` inside `.submission-success` makes component exceed vertical height. Root `overflow: hidden` clips reset button off-screen.
- **CSS Best-Practice Fix**: Replace fixed padding with `clamp(28px, 6vw, 56px)` and remove rigid `min-height` lock (`min-height: auto`).

---

### Group 4: Interactive Portfolio Deck Component (`PortfolioDeck.jsx`)

#### FLAW-24: Unhandled Overflow & Content Clipping in Expanded Portfolio Modal (CSS Level)
- **Component**: `PortfolioDeck.jsx` / `src/index.css`
- **File Path**: `src/index.css`
- **Line Numbers**: 444–453, 489–492, 897–899
- **Exact Code Snippet**:
  ```css
  .portfolio-expanded-card { position: relative; width: 100%; max-width: 1100px; height: min(800px, 90vh); overflow: hidden; display: flex; }
  .member-left-col { width: 40%; padding: 48px; }
  .member-right-col { width: 62%; padding: 48px; }
  ```
- **Breakpoint Impact**:
  - **Desktop (>1024px)** & **Tablet (769px–1024px)**: Modal height is locked to `min(800px, 90vh)` with `overflow: hidden`. Right column contains ~1100px of text and projects. Lacking `overflow-y: auto`, >400px of content is clipped and unscrollable.
- **CSS Best-Practice Fix**: `.member-right-col { overflow-y: auto; max-height: 100%; scrollbar-width: thin; }`.

---

#### FLAW-25: Fixed 3D Member Card Height Overflowing Mobile Layout
- **Component**: `PortfolioDeck.jsx` / `src/index.css`
- **File Path**: `src/index.css`
- **Line Numbers**: 521–537, 987–995
- **Exact Code Snippet**:
  ```css
  .member-intro-card { position: relative; width: 100%; max-width: 320px; height: 480px; }
  @media (max-width: 768px) { .member-left-col { width: 100%; min-height: 50vh; } }
  ```
- **Breakpoint Impact**:
  - **Mobile (<640px)**: On mobile viewports with 600px height (50vh = 300px), fixed 480px card overflows `.member-left-col` by >130px, obscuring right column text below it.
- **CSS Best-Practice Fix**: `.member-intro-card { height: clamp(360px, 60vh, 480px); }`.

---

#### FLAW-26: Navigation Controls Collision in Modal Header on Small Phones (<400px)
- **Component**: `PortfolioDeck.jsx` / `src/index.css`
- **File Path**: `src/index.css`
- **Line Numbers**: 762–769, 771–774, 996–997
- **Exact Code Snippet**:
  ```css
  .member-back-nav { position: absolute; top: 32px; left: 32px; z-index: 100; }
  .member-nav-bar { position: absolute; top: 32px; right: 32px; z-index: 100; }
  ```
- **Breakpoint Impact**:
  - **Mobile (<400px)**: Back button (~135px) and pagination controls (~145px) collide in top header on small phones (total 280px + margins > 320px screen width).
- **CSS Best-Practice Fix**: `@media (max-width: 480px) { .member-back-nav span { display: none; } .member-back-nav { padding: 8px; border-radius: 50%; } }`.

---

#### FLAW-27: Missing Vertical Scrollbar in Expanded Portfolio Modal Right Column (JSX Level)
- **Component**: `PortfolioDeck.jsx`
- **File Path**: `src/components/PortfolioDeck.jsx`
- **Line Numbers**: 765–773
- **Exact Code Snippet**:
  ```jsx
  <motion.div className="member-right-col" ...>
    <AnimatePresence mode="wait">
      <motion.div className="member-info-content"> ... </motion.div>
    </AnimatePresence>
  </motion.div>
  ```
- **Breakpoint Impact**:
  - **Desktop (>1024px)** & **Tablet (769px–1024px)**: JSX container lacks inline or class overflow handling for long bio, experience, and project cards list.
- **CSS Best-Practice Fix**: Add `overflow-y: auto` property directly to `.member-right-col` CSS wrapper.

---

#### FLAW-28: Touch Drag Gesture Conflict on Mobile Portfolio Cards
- **Component**: `PortfolioDeck.jsx`
- **File Path**: `src/components/PortfolioDeck.jsx`
- **Line Numbers**: 555–568
- **Exact Code Snippet**:
  ```jsx
  <motion.article drag={isCurrent ? 'x' : false} dragConstraints={{ left: 0, right: 0 }} style={{ touchAction: isCurrent ? 'pan-y' : 'auto' }}>
  ```
- **Breakpoint Impact**:
  - **Mobile (<640px)** & **Touch Devices**: Horizontal drag gesture conflicts with vertical page touch scrolling, causing card jumping during scroll.
- **CSS Best-Practice Fix**: Disable touch drag on touch screens (`drag={isMobile ? false : 'x'}`).

---

### Group 5: Reviewer Workspace (`DashboardPage.jsx`, `ReviewerDashboard.jsx`)

#### FLAW-29: Reviewer Filters Grid Squeezing on Tablet Viewports (769px–1024px)
- **Component**: `ReviewerDashboard.jsx` / `src/index.css`
- **File Path**: `src/index.css`
- **Line Numbers**: 375, 903–904
- **Exact Code Snippet**:
  ```css
  .reviewer-filters { display: grid; grid-template-columns: minmax(200px, 1fr) 135px minmax(150px, 0.75fr) 135px auto; gap: 10px; }
  @media (max-width: 1024px) { .reviewer-filters { grid-template-columns: 1fr 120px 140px 120px auto; } }
  ```
- **Breakpoint Impact**:
  - **Tablet (640px–1024px)**: On tablet screen width ~769px (container width 721px), fixed column widths (`120px 140px 120px auto`) consume 520px, leaving only ~200px for text search input (`1fr`), severely truncating search text and placeholders.
- **CSS Best-Practice Fix**: `@media (max-width: 1024px) { .reviewer-filters { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; } }`.

---

#### FLAW-30: Reviewer Login Card Fixed Pixel Padding & Non-Fluid Heading Typography
- **Component**: `ReviewerDashboard.jsx` / `src/index.css`
- **File Path**: `src/components/ReviewerDashboard.jsx` & `src/index.css`
- **Line Numbers**: `ReviewerDashboard.jsx:17-60`, `index.css:375`
- **Exact Code Snippet**:
  ```css
  .dashboard-login { max-width: 490px; margin: 30px auto; padding: 42px; text-align: center; }
  .dashboard-login h2 { margin: 14px 0 9px; font-size: 2.25rem; letter-spacing: -0.04em; }
  ```
- **Breakpoint Impact**:
  - **Mobile (<640px)**: 42px left/right padding consumes 84px of 296px container width, leaving only 212px form width. 2.25rem (36px) `h2` wraps into 4 awkward lines.
- **CSS Best-Practice Fix**: `.dashboard-login { padding: clamp(20px, 6vw, 42px); } .dashboard-login h2 { font-size: clamp(1.5rem, 4.5vw, 2.25rem); }`.

---

#### FLAW-31: Date String Ellipsis Truncation in Sync Summary Cards on Tablet (640px–1024px)
- **Component**: `ReviewerDashboard.jsx` / `src/index.css`
- **File Path**: `src/components/ReviewerDashboard.jsx` & `src/index.css`
- **Line Numbers**: `ReviewerDashboard.jsx:62-82`, `index.css:375, 1057-1063`
- **Exact Code Snippet**:
  ```css
  .sync-summary { display: grid; grid-template-columns: repeat(3, 1fr); }
  .sync-summary strong { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  ```
- **Breakpoint Impact**:
  - **Tablet (640px–1024px)**: 3 equal columns in 720px tablet container provide only 194px content width. Date strings like `"10 Aug 2026, 17:05"` are truncated with `...`.
- **CSS Best-Practice Fix**: `@media (max-width: 1024px) { .sync-summary { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); } } .sync-summary strong { white-space: normal; }`.

---

#### FLAW-32: Select Option Clipping in Filter Controls Bar on Tablet (640px–1024px)
- **Component**: `ReviewerDashboard.jsx` / `src/index.css`
- **File Path**: `src/components/ReviewerDashboard.jsx` & `src/index.css`
- **Line Numbers**: `ReviewerDashboard.jsx:190-210`, `index.css:375, 903`
- **Exact Code Snippet**:
  ```css
  @media (max-width: 1024px) { .reviewer-filters { grid-template-columns: 1fr 120px 140px 120px auto; } }
  ```
- **Breakpoint Impact**:
  - **Tablet (640px–1024px)**: 120px fixed select widths clip dropdown options ("Pending export", "Second year").
- **CSS Best-Practice Fix**: Use flexible `minmax()` track sizes (`minmax(140px, 1fr)`).

---

#### FLAW-33: Mandatory Horizontal Scrolling on Desktop Data Table on Tablet Viewports (769px–1024px)
- **Component**: `ReviewerDashboard.jsx` / `src/index.css`
- **File Path**: `src/components/ReviewerDashboard.jsx` & `src/index.css`
- **Line Numbers**: `ReviewerDashboard.jsx:222-240`, `index.css:809-811, 1041-1043`
- **Exact Code Snippet**:
  ```css
  .reviewer-table { width: 100%; min-width: 810px; }
  @media (max-width: 768px) { .desktop-only-table { display: none !important; } .mobile-only-cards { display: flex !important; } }
  ```
- **Breakpoint Impact**:
  - **Tablet (769px–1024px)**: Mobile card view activates only at `<= 768px`. Tablets (769px–1024px) render 810px table in ~720px space, forcing mandatory horizontal scrolling.
- **CSS Best-Practice Fix**: Change mobile card threshold to `@media (max-width: 1024px)`.

---

#### FLAW-34: Close Button Collision & Unhandled String Breakage in Application Drawer
- **Component**: `ReviewerDashboard.jsx` / `src/index.css`
- **File Path**: `src/components/ReviewerDashboard.jsx` & `src/index.css`
- **Line Numbers**: `ReviewerDashboard.jsx:84-118`, `index.css:375, 1069-1076`
- **Exact Code Snippet**:
  ```css
  .drawer-close { float: right; }
  .application-drawer h2 { font-size: 2.4rem; }
  .application-drawer dd { white-space: pre-wrap; }
  ```
- **Breakpoint Impact**:
  - **Mobile (<640px)**: 2.4rem static `h2` collides with floating close button. `<dd>` lacks word-break, causing long text strings (email, portfolio link URLs) to overflow drawer boundaries.
- **CSS Best-Practice Fix**: `.application-drawer h2 { font-size: clamp(1.5rem, 5vw, 2.4rem); word-break: break-word; } .application-drawer dd { overflow-wrap: anywhere; word-break: break-word; }`.

---

### Group 6: Admin Suite, Routing & Custom Hooks (`AdminDashboardPage.jsx`, `AdminLogin.jsx`, `App.jsx`, `useIsMobile.js`, `useTheme.js`)

#### FLAW-35: Admin Suite Theme Isolation & Hardcoded Dark Inline Styles
- **Component**: `AdminDashboardPage.jsx`
- **File Path**: `src/pages/admin/AdminDashboardPage.jsx`
- **Line Numbers**: 130–783
- **Exact Code Snippet**:
  ```jsx
  <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem', color: '#f8fafc' }}>
    <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}> ...
  ```
- **Breakpoint Impact**: All Breakpoints (Mobile, Tablet, Desktop): Hardcodes dark slate colors (`#f8fafc`, `rgba(15, 23, 42, 0.6)`) directly in inline styles, completely isolating Admin Dashboard from light/dark theme toggles.
- **CSS Best-Practice Fix**: Replace inline style objects with CSS design tokens (`var(--surface)`, `var(--ink)`, `var(--border)`).

---

#### FLAW-36: Stat Overview Cards Fixed Min-Width Grid Overcrowding on Mobile (<640px)
- **Component**: `AdminDashboardPage.jsx`
- **File Path**: `src/pages/admin/AdminDashboardPage.jsx`
- **Line Numbers**: 205–273
- **Exact Code Snippet**:
  ```jsx
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
  ```
- **Breakpoint Impact**:
  - **Mobile (<640px)**: On screens <360px (~288px container width), `minmax(220px, 1fr)` forces 4 stat cards to stack vertically, taking >480px height and pushing applicant table off-screen.
- **CSS Best-Practice Fix**: `@media (max-width: 640px) { .admin-stat-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; } }`.

---

#### FLAW-37: Missing Mobile Responsive Card Fallback for Admin Applicant Data Table
- **Component**: `AdminDashboardPage.jsx`
- **File Path**: `src/pages/admin/AdminDashboardPage.jsx`
- **Line Numbers**: 406–493
- **Exact Code Snippet**:
  ```jsx
  <div style={{ background: 'rgba(15, 23, 42, 0.6)', overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
  ```
- **Breakpoint Impact**:
  - **Mobile (<640px)** & **Tablet (640px–1024px)**: Admin table lacks card fallback, forcing 6-column HTML table onto phone screens with compulsory horizontal scrolling.
- **CSS Best-Practice Fix**: Port responsive card view system from `ReviewerDashboard.jsx` into `AdminDashboardPage.jsx` for `<= 768px`.

---

#### FLAW-38: Sub-Admin Form Min-Width Viewport Overflow on Small Phones (<360px)
- **Component**: `AdminDashboardPage.jsx`
- **File Path**: `src/pages/admin/AdminDashboardPage.jsx`
- **Line Numbers**: 498–634
- **Exact Code Snippet**:
  ```jsx
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
  ```
- **Breakpoint Impact**:
  - **Mobile (<360px)**: On small mobile screens (320px width), `minmax(320px, 1fr)` plus outer padding (32px) specifies 352px width, bleeding off-screen horizontally.
- **CSS Best-Practice Fix**: `grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));`.

---

#### FLAW-39: Admin Login Card Hardcoded Theme Contrast & Mobile Padding Squeeze
- **Component**: `AdminLogin.jsx`
- **File Path**: `src/pages/admin/AdminLogin.jsx`
- **Line Numbers**: 27–183
- **Exact Code Snippet**:
  ```jsx
  <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '2.5rem', maxWidth: '440px' }}>
  ```
- **Breakpoint Impact**:
  - **Mobile (<640px)**: 2.5rem padding (80px total) leaves only 208px form width on a 320px screen. Hardcodes dark slate color, ignoring theme state.
- **CSS Best-Practice Fix**: Use fluid padding `padding: clamp(20px, 6vw, 40px)` and CSS variables (`var(--surface-raised)`).

---

#### FLAW-40: Public Navigation Shell Wrapper Stacking on Admin Routes
- **Component**: `App.jsx`
- **File Path**: `src/App.jsx`
- **Line Numbers**: 33–46
- **Exact Code Snippet**:
  ```jsx
  <SiteShell theme={theme} setTheme={setTheme}>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
    </Routes>
  </SiteShell>
  ```
- **Breakpoint Impact**: All Breakpoints (Mobile, Tablet, Desktop): `SiteShell` wraps ALL routes, forcing public header and footer to stack above/below admin dashboard, creating double headers and footers on mobile.
- **CSS Best-Practice Fix**: Create a `<PublicLayout>` wrapper component for public routes and render admin routes standalone.

---

#### FLAW-41: Hydration Mismatch & Hardcoded 768px Breakpoint in `useIsMobile` Hook
- **Component**: `useIsMobile.js` / `useTheme.js`
- **File Path**: `src/hooks/useIsMobile.js`
- **Line Numbers**: 3–22
- **Exact Code Snippet**:
  ```js
  export function useIsMobile(breakpoint = 768) {
    const [isMobile, setIsMobile] = useState(() => {
      if (typeof window === 'undefined') return false
      return window.innerWidth <= breakpoint
    })
  ```
- **Breakpoint Impact**: All Viewports: Hardcoded 768px default misses modern 3-tier breakpoint standards (Mobile `<640px`, Tablet `640px-1024px`, Desktop `>1024px`). Window check causes hydration shifts during initial render.
- **CSS Best-Practice Fix**: Default to 640px, support `matchMedia`, and handle SSR hydration cleanly.

---

## 6. Summary Matrix of Flaws by Breakpoint

| Flaw ID | Component / File | Breakpoint Impact (Mobile <640px) | Breakpoint Impact (Tablet 640-1024px) | Breakpoint Impact (Desktop >1024px) | Recommended CSS Best Practice Fix |
|---|---|---|---|---|---|
| **FLAW-01** | `index.css` (`.site-shell`) | Layout height jump (`100vh`) | Sticky scroll broken (`overflow: hidden`) | Sticky scroll broken (`overflow: hidden`) | Use `min-height: 100dvh; overflow-x: clip;` |
| **FLAW-02** | `index.css` (`.site-header`) | Drawer toggle active | Desktop nav collides (769-1024px) | Nav fits comfortably | Set nav hide breakpoint to `<= 1024px` |
| **FLAW-03** | `index.css` (`.mobile-drawer`) | Bottom links clipped (<500px h) | N/A | N/A | Use `max-height: 100dvh; overflow-y: auto;` |
| **FLAW-04** | `SiteShell.jsx` (Brand Logo) | Hardcoded 32px | Hardcoded 32px | Hardcoded 32px | Use `.brand-logo-img` CSS class |
| **FLAW-05** | `SiteShell.jsx` (Brand Mark) | Dark mode color mismatch | Dark mode color mismatch | Dark mode color mismatch | Remove inline hex color, use `var(--violet)` |
| **FLAW-06** | `HeroVideoBackground.jsx` | Container overflow | Container overflow | Horiz page scrollbar (`100vw`) | Use `width: 100%; max-width: 100dvw;` |
| **FLAW-07** | `HomePage.jsx` / `index.css` | 1-col stack at <=768px | Copy text squished to ~380px | 2-col grid fits well | Collapse hero grid to 1-col at `<= 1024px` |
| **FLAW-08** | `index.css` (`.hero-orbit`) | Badges overlap emblem | Badges misalign | Scaled to 340px | Replace px offsets with `%` radial coordinates |
| **FLAW-09** | `HomePage.jsx` / `index.css` | 104px logo crowds orbit ring | Fits reasonably | Fits 340px ring | Use `width: clamp(80px, 28vw, 104px)` |
| **FLAW-10** | `HomePage.jsx` / `index.css` | 1-col stack at <=480px | Buttons overflow (481-768px) | Fits horizontally | Add `flex-wrap: wrap` & stack at `<= 640px` |
| **FLAW-11** | `HomePage.jsx` / `index.css` | Text lines clipped (290px h) | Text lines clipped | Fits 310px height | Use `min-height: auto; overflow: visible;` |
| **FLAW-12** | `HomePage.jsx` / `index.css` | 1-col stack | Right col text squished | Fits 2-col grid | Use `clamp()` text & fluid grid columns |
| **FLAW-13** | `PageFlipSection.jsx` | Fallback active | 3D transform breaks | 3D transform breaks | Change `.site-shell { overflow: hidden }` to `clip` |
| **FLAW-14** | `PageFlipSection.jsx` | Fallback active | 3D scroll stutter (769-1024px) | Works smoothly | Increase fallback threshold to `1024px` |
| **FLAW-15** | `PageFlipSection.jsx` | Scroll gap jitter (`100vh`) | Scroll gap jitter | Fits screen | Replace `100vh` with dynamic `100dvh` |
| **FLAW-16** | `HeroVideoBackground.jsx` | Video cropped on sides | Video cropped | Widescreen cover | Add `object-position: center center;` |
| **FLAW-17** | `HeroVideoBackground.jsx` | Controls overlap text | OK | OK | Add `@media (max-width: 640px)` controls scale |
| **FLAW-18** | `ApplicationForm.jsx` | Mobile slide ok | Step exit height collapse | Step exit height collapse | Use `AnimatePresence mode="wait"` |
| **FLAW-19** | `ApplicationForm.jsx` | 1-col stack | Unsymmetrical empty grid hole | Unsymmetrical empty grid hole | Set 3rd item to `grid-column: 1 / -1` |
| **FLAW-20** | `ApplicationForm.jsx` | Breakpoint match | JS state mismatch at 768px | Breakpoint match | Align JS threshold with CSS (`1024` or `640`) |
| **FLAW-21** | `ApplicationForm.jsx` | Markers float without track | Step labels shown | Step labels shown | Add `.form-progress::before` track line |
| **FLAW-22** | `ApplicationForm.jsx` | 1-col stack | Row 2 Col 2 empty hole | Row 2 Col 2 empty hole | Set 3rd preference item to `grid-column: 1 / -1` |
| **FLAW-23** | `ApplyPage.jsx` | Button clipped (<600px h) | OK | Centered nicely | Use fluid padding `clamp()` & `min-height: auto` |
| **FLAW-24** | `index.css` (`.portfolio-modal`) | Column stack ok | >400px content clipped | >400px content clipped | Add `.member-right-col { overflow-y: auto }` |
| **FLAW-25** | `index.css` (`.member-intro`) | Card bleeds >130px (50vh) | OK | OK | Use `height: clamp(360px, 60vh, 480px)` |
| **FLAW-26** | `index.css` (`.member-nav`) | Top header buttons collide | OK | OK | Hide text label on `<=480px` (`display: none`) |
| **FLAW-27** | `PortfolioDeck.jsx` | Column stack ok | Right col content clipped | Right col content clipped | Add `overflow-y: auto` to right column wrapper |
| **FLAW-28** | `PortfolioDeck.jsx` | Touch swipe scroll conflict | Touch swipe scroll conflict | Mouse drag ok | Disable touch drag on touch screens (`drag={false}`) |
| **FLAW-29** | `index.css` (`.reviewer-filters`)| Mobile drawer active | Search input squished (<200px) | Fits multi-col | Use `repeat(auto-fit, minmax(140px, 1fr))` |
| **FLAW-30** | `ReviewerDashboard.jsx` | 42px padding squishes form | OK | Fits nicely | Use `padding: clamp(20px, 6vw, 42px)` |
| **FLAW-31** | `ReviewerDashboard.jsx` | 1-col summary stack | Date string truncated `...` | Fits 3 columns | Use `repeat(auto-fit, minmax(200px, 1fr))` grid |
| **FLAW-32** | `ReviewerDashboard.jsx` | Mobile drawer active | Select option labels clipped | Fits multi-col | Use flexible `minmax(140px, 1fr)` tracks |
| **FLAW-33** | `ReviewerDashboard.jsx` | Mobile card view active | Mandatory horizontal scroll | Table fits well | Activate mobile card view at `<= 1024px` |
| **FLAW-34** | `ReviewerDashboard.jsx` | h2 collides with close btn | OK | OK | Use flex header & `word-break: break-word` |
| **FLAW-35** | `AdminDashboardPage.jsx` | Light mode color broken | Light mode color broken | Light mode color broken | Replace hardcoded colors with CSS variables |
| **FLAW-36** | `AdminDashboardPage.jsx` | 4 stacked cards push table | 2x2 grid fits | 4 cards in 1 row | Use 2-col compact grid on mobile (`<=640px`) |
| **FLAW-37** | `AdminDashboardPage.jsx` | Table forces horiz scroll | Table forces horiz scroll | Table fits well | Port mobile card view architecture for `<=768px` |
| **FLAW-38** | `AdminDashboardPage.jsx` | Form bleeds screen (<360px) | OK | OK | Use `minmax(min(100%, 280px), 1fr)` |
| **FLAW-39** | `AdminLogin.jsx` | 2.5rem padding squishes form | Fits centered | Fits centered | Use `padding: clamp(20px, 6vw, 40px)` & CSS vars |
| **FLAW-40** | `App.jsx` | Double header/footer | Double header/footer | Double header/footer | Separate public routes from admin routes |
| **FLAW-41** | `useIsMobile.js` | Hydration layout shift | Breakpoint mismatch | Breakpoint mismatch | Default to 640px & handle SSR hydration |

---

## 7. Remediation Action Plan & Verification Methodology

### Phase 1: High-Priority Root Layout & Overflow Remediation (Immediate Execution)
1. **Fix Root Overflow Constraints in `src/index.css`**:
   - Change `.site-shell { overflow: hidden; }` to `overflow-x: clip;` to allow child `position: sticky` elements to function while preventing horizontal scrollbar bleed.
   - Update `body` and `.site-shell` `min-height` from `100vh` to `100dvh`.
   - Update `.hero-video-container` from `width: 100vw; left: 50%; transform: translateX(-50%);` to `width: 100%; max-width: 100dvw; left: 0; transform: none;`.
2. **Fix Modal Content Clipping in `src/index.css` & `PortfolioDeck.jsx`**:
   - Add `overflow-y: auto; max-height: 100%;` to `.member-right-col`.
   - Add `max-height: 100dvh; overflow-y: auto;` to `.mobile-drawer`.
3. **Fix Header & Mobile Breakpoints**:
   - Lower desktop header nav hiding breakpoint from `768px` to `1024px` in `src/index.css`.
   - Lower table-to-card display threshold in `ReviewerDashboard.jsx` from `768px` to `1024px`.

### Phase 2: Design Token Harmonization & Component Typography (Targeted Refactoring)
1. **Admin Suite Theme Integration**:
   - Refactor `AdminDashboardPage.jsx` and `AdminLogin.jsx` inline styles to use global design tokens (`var(--surface)`, `var(--ink)`, `var(--border)`).
2. **Fluid Typography & Flexible Grids**:
   - Convert fixed `px` padding in `.dashboard-login` and `.admin-login-card` to `clamp(20px, 6vw, 42px)`.
   - Convert static `2.25rem` and `2.4rem` headings in modals/drawers to `clamp(1.5rem, 5vw, 2.4rem)` with `word-break: break-word`.
   - Add `.form-grid > .form-field:nth-child(3):last-child { grid-column: 1 / -1; }` to eliminate asymmetrical empty grid holes in 3-field form steps.
3. **Orbit Radial Coordinates & Card Heights**:
   - Convert `.hero-orbit span` pixel offsets (`top: 33px`, `bottom: 94px`) to percentage coordinates (`top: 8%`, `bottom: 26%`).
   - Change `.member-intro-card` height to `clamp(360px, 60vh, 480px)`.

### Phase 3: Route Architecture & Dynamic JS State Synchronization
1. **App Route Layout Separation in `App.jsx`**:
   - Wrap public routes (`/`, `/apply`, `/dashboard`) inside `<SiteShell>` layout.
   - Render admin routes (`/admin/login`, `/admin/dashboard`) as standalone routes without public site header and footer wrappers.
2. **Hook Threshold Standardization**:
   - Update `useIsMobile.js` default breakpoint to `640px` and update `PageFlipSection.jsx` and `ApplicationForm.jsx` invocation threshold parameters to `1024px` or `640px`.

---

### Step-by-Step Independent Verification Methodology

To verify all fixes independently after implementation, execute the following commands and inspection procedures:

1. **Development Server & Build Verification**:
   ```bash
   cd d:\CODE\Test\aarana
   npm run build
   ```
   *Expected Output*: Clean Vite production bundle compilation with 0 syntax or module resolution errors.

2. **Automated Layout & Breakpoint Emulation Testing**:
   - Launch application preview server:
     ```bash
     npm run preview
     ```
   - Test across standard device viewports using DevTools Emulation:
     - **Mobile Small (320px x 568px - iPhone SE)**: Verify zero horizontal body scrollbar, mobile drawer scrollability, orbit badge positioning, and modal button layout.
     - **Mobile Portrait (390px x 844px - iPhone 12/13/14)**: Verify form progress bar track line, step navigation height transitions, and video background fit.
     - **Tablet Portrait (768px x 1024px - iPad)**: Verify header collapses to mobile toggle, reviewer table converts to mobile card list, and hero section stacks cleanly to 1 column.
     - **Tablet Landscape (820px x 1180px - iPad Air)**: Verify no navigation item collision in header, reviewer filter select options display without text clipping, and modal right column scrolls vertically.
     - **Desktop Widescreen (1440px x 900px - Windows OS)**: Verify zero horizontal scrollbar caused by `100vw`, working `PageFlipSection` 3D sticky scroll, and proper light/dark theme toggling on Admin Dashboard.

3. **Theme & Dark Mode Verification**:
   - Toggle theme state between Light (`data-theme='light'`) and Dark (`data-theme='dark'`).
   - Confirm Admin Dashboard (`/admin/dashboard`) and Admin Login (`/admin/login`) adapt to light ivory tokens without hardcoded slate background locking.

---

## 8. Conclusion

This Master Responsive Design QA Report synthesizes all empirical observations and static code analysis from Explorer 1, Explorer 2, and Explorer 3 into an actionable engineering document. By implementing the 3-phase remediation plan, the AARNA application will achieve complete 3-tier breakpoint compliance (<640px Mobile, 640px–1024px Tablet, >1024px Desktop), smooth fluid typography, zero unhandled viewport overflows, and consistent cross-theme rendering across all 15 component source files.
