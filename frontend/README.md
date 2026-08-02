# AARNA OC Recruitment Frontend

This Vite + React application is the public AARNA Club recruitment experience and the read-only reviewer dashboard. It uses an ivory/golden-orange and deep-violet visual system, responsive layouts, Framer Motion transitions, accessible form controls, and a persisted light/dark theme.

## Frontend architecture

```text
frontend/
├── public/_redirects          # Cloudflare Pages SPA fallback
├── src/
│   ├── App.jsx                # Browser routes and theme provider
│   ├── api/client.js          # One JSON fetch client for every API call
│   ├── components/
│   │   ├── SiteShell.jsx      # Header, navigation, theme toggle and footer
│   │   ├── ApplicationForm.jsx# Three-step validated application flow
│   │   ├── PortfolioDeck.jsx  # Animated portfolio cards
│   │   └── ReviewerDashboard.jsx
│   ├── pages/                 # Home, Apply and Dashboard route screens
│   ├── hooks/useTheme.js      # localStorage/system theme preference
│   ├── data/clubContent.js    # AARNA copy and portfolio descriptions
│   ├── assets/aarna.jpg       # Supplied AARNA artwork
│   └── index.css              # Theme tokens, responsive and reduced-motion CSS
├── .env.example
└── package.json
```

## User and data flow

1. `App` mounts the router and `SiteShell`; the browser opens `/`, `/apply`, or `/dashboard`.
2. The home page presents AARNA's story, mission, vision, objectives, coordinator information, and seven animated portfolio cards.
3. The apply page collects the applicant in three steps. The form validates each step locally, preserves values while the API wakes up, and sends a JSON payload to the Flask API.
4. On success the form displays the application UUID and explains that PostgreSQL storage is immediate while Sheets appears on the next batch sync.
5. The dashboard first creates a reviewer session with the password. The signed token remains in component memory only; it is used to load read-only applications and sync health with search and filters.

## Routes and features

| Route | Screen | Main behavior |
|---|---|---|
| `/` | `HomePage` | AARNA introduction, content sections, portfolio deck and apply CTA. |
| `/apply` | `ApplyPage` | Three-step application flow with inline validation and retry/wake-up feedback. |
| `/dashboard` | `DashboardPage` | Password login, searchable/filterable reviewer table, sync status and detail drawer. |

The seven portfolio choices are Technical team, Production team, Designing team, Documentation team, Social Media & Promotion team, Hospitality team, and Marketing & Sponsorship team. Primary and secondary choices are required to be different by the backend.

## Component and function reference

- `App()` defines the browser routes and supplies the theme context.
- `useTheme()` reads `aarna-theme` from localStorage, falls back to the system preference, and exposes a toggle without leaking server secrets.
- `SiteShell()` renders shared navigation, the mobile-friendly menu, the theme button, and footer around each page.
- `PortfolioDeck()` maps the portfolio data into Framer Motion cards and respects reduced-motion preferences.
- `ApplicationForm()` owns form values, current step, field errors, loading state, wake-up retry, and success state. `validateStep()` checks only the visible step; `updateValue()` updates one controlled field; `goForward()` advances after validation; `submit()` calls `submitApplication()` and renders a confirmation or API error. `FormField` supplies consistent labels, hints, and accessible error text.
- `api/client.js` has one request helper that sends/receives JSON and converts non-2xx responses into consistent errors. `submitApplication`, `createReviewerSession`, `getApplications`, and `getSyncStatus` are the typed application-level calls.
- `ReviewerDashboard()` keeps the in-memory token, loads applications and sync status, applies search/filter controls, and opens the selected read-only application. `DashboardLogin`, `SyncSummary`, and `ApplicationDrawer` separate login, health, and detail presentation.

Source files contain concise comments and descriptive names for implementation blocks; this section documents the runtime responsibilities without changing the working code.

## Run locally on Windows

Prerequisites: Node.js 20+ and a running backend API.

```powershell
cd C:\path\to\flask_react\frontend
npm.cmd install
Copy-Item .env.example .env.local
```

Set the API URL in `.env.local`:

```text
VITE_API_BASE_URL=http://127.0.0.1:5000/api
```

Start the development server:

```powershell
npm.cmd run dev
```

Then open the URL printed by Vite (normally `http://localhost:5173`). Use `npm.cmd` on PowerShell if `npm.ps1` is blocked by the execution policy.

## Quality checks and production build

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd run preview
```

The production files are written to `dist/`. The `_redirects` file maps every Cloudflare Pages route to `index.html`, so refreshing `/apply` or `/dashboard` works with the React router.

## Cloudflare Pages deployment

Create a Pages project connected to this repository and configure:

- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://your-render-api.example.com/api`

`VITE_` variables are embedded in browser JavaScript, so they may contain the public API URL but must never contain database passwords, admin passwords, service-account JSON, or token secrets. Configure the backend CORS origin to the exact Cloudflare Pages origin.

## API contract used by the UI

The client calls `GET /api/health`, `GET /api/application-options`, and `POST /api/applications` without authentication. The dashboard calls `POST /api/admin/session`, then sends `Authorization: Bearer <token>` to `GET /api/admin/applications` and `GET /api/admin/sync-status`. All payloads are JSON; backend validation errors are displayed next to the relevant fields or in the form alert.

## Sharing with teammates

Give teammates the repository (or both folders) and ask them to install Node.js, copy `.env.example` to `.env.local`, set their backend URL, run `npm.cmd install`, and run `npm.cmd run dev`. They do not need Google credentials to use the public form; only the backend deployment/cron service needs those secrets. For an entirely local demo, a friend can run the Flask backend separately and point `VITE_API_BASE_URL` at its port 5000.

## Troubleshooting

- A blank page after navigating directly to a deployed route means the Pages `_redirects` file was omitted; keep `public/_redirects` in the build.
- Network errors usually mean Flask is stopped, the API URL is wrong, or backend CORS does not include the frontend origin.
- If the form appears to reset, do not refresh during the Render wake-up retry; the component intentionally keeps entered values in memory while retrying.
- A dashboard session is intentionally lost on refresh. Sign in again rather than persisting reviewer credentials in localStorage.
