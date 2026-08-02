# AARNA Recruitment Platform

This repository contains the full-stack web application for the AARNA Recruitment Platform. It is composed of a **React + Vite Frontend** and a **Python + Flask Backend** backed by PostgreSQL. The system allows candidates to submit club applications, and provides a protected dashboard for reviewers to manage these applications, along with an automated integration to Google Sheets.

---

## 🏗️ Architecture & Protocols

*   **Frontend**: React (Vite, React Router, Framer Motion, Tailwind/Custom CSS).
*   **Backend**: Python Flask with SQLAlchemy.
*   **Database**: PostgreSQL (Authoritative record for all applications).
*   **External Integration**: Google Sheets API v4 (exports submitted applications to a shared club sheet).
*   **Protocols**: 
    *   **HTTP/REST**: All communication between frontend and backend uses JSON over HTTP/REST protocols.
    *   **Authentication**: Uses stateless signed Bearer tokens (via `itsdangerous` `URLSafeTimedSerializer`).

---

## 📂 Data File Structure

The project is strictly divided into `frontend/` and `backend/` directories.

### Backend Structure (`/backend`)
*   `app/api/`: Contains the REST endpoints.
    *   `public.py`: Endpoints for submitting applications (`POST /applications`) and fetching choices.
    *   `admin.py`: Protected endpoints for reviewers (`POST /session`, `GET /applications`, `GET /sync-status`).
*   `app/models.py`: Database models (`Application`, `SheetSyncRun`).
*   `app/auth.py`: Handles token generation and validation.
*   `app/schemas.py`: Validation for incoming application data.
*   `app/services/sheets.py`: Service class `GoogleSheetsSynchronizer` to sync rows to Google Sheets.
*   `app/repositories/`: Queries and data access layer.
*   `main.py` / `wsgi.py`: App entry points.

### Frontend Structure (`/frontend`)
*   `src/api/client.js`: API client wrapper (`fetch` API), managing requests and authentication headers.
*   `src/components/`: Reusable React components (`ApplicationForm.jsx`, `PortfolioDeck.jsx`, `ReviewerDashboard.jsx`, `SiteShell.jsx`).
*   `src/pages/`: Core page views (`HomePage.jsx`, `ApplyPage.jsx`, `DashboardPage.jsx`).
*   `src/data/clubContent.js`: Text content, objectives, and descriptions for the club portfolios.
*   `src/hooks/useTheme.js`: Custom hook managing theme states.
*   `src/index.css`: Global styles, layout, and theming.

---

## ⚙️ Core Functions & APIs

### Database Models
1.  **Application**: Stores `full_name`, `college_email`, `phone`, `roll_number`, `academic_department`, `year`, `section`, `primary_portfolio`, `secondary_portfolio`, `skills`, `experience`, `motivation`, and `sync_state`.
2.  **SheetSyncRun**: Audit log for Google Sheets sync jobs (tracks successes, failures, and errors).

### API Endpoints
*   `GET /api/health`: Confirms the API and DB are running.
*   `GET /api/application-options`: Exposes form dropdown options (portfolios, years).
*   `POST /api/applications`: Submits a new application payload.
*   `POST /api/admin/session`: Validates a reviewer password and returns a secure token.
*   `GET /api/admin/applications`: Returns a paginated, filterable list of applications to reviewers.
*   `GET /api/admin/sync-status`: Exposes background Google Sheet sync status to reviewers.

---

## ⚠️ Contribution Guidelines (Important)

If you are a frontend developer working on this repository, please strictly adhere to the following rules regarding what can and cannot be modified.

### ✅ Files You CAN Edit (Safe to change)
*   **Pages:**
    *   `frontend/src/pages/HomePage.jsx`
    *   `frontend/src/pages/ApplyPage.jsx`
    *   `frontend/src/pages/DashboardPage.jsx`
*   **Components:**
    *   `frontend/src/components/SiteShell.jsx`
    *   `frontend/src/components/ApplicationForm.jsx`
    *   `frontend/src/components/PortfolioDeck.jsx`
    *   `frontend/src/components/ReviewerDashboard.jsx`
*   **Data & Styling:**
    *   `frontend/src/data/clubContent.js` — Safe to update AARNA text, objectives, and portfolio descriptions.
    *   `frontend/src/index.css` — Colors, spacing, responsive layout, animations.
    *   `frontend/src/hooks/useTheme.js` — Only if changing theme behavior.
*   **Assets:**
    *   `frontend/public/` — Frontend public assets.
    *   `frontend/src/assets/` — Images and logos.

### 🚫 Files You Should NOT Change (Without coordinating)
*   `frontend/src/api/client.js` — Must match backend API contracts, URLs, and request field names.
*   **Auth Logic** — Authentication/token logic inside `ReviewerDashboard.jsx`.
*   `frontend/src/App.jsx` — Coordinate before changing routing.
*   `frontend/package.json` — Do not remove dependencies or change versions casually.
*   `frontend/public/_redirects` — Required for Cloudflare Pages deployment routes.
*   **Backend** — *Anything* inside the `backend/` directory should be left untouched by frontend developers unless previously agreed upon.

---

## 🚀 Setup & Installation (Windows)

### 1. Install Dependencies
Open PowerShell and navigate to the frontend directory:
```powershell
cd C:\Users\Pavan\Desktop\flask_react\frontend
npm.cmd install
```
*(This installs libraries like React, React Router, Framer Motion, Lucide icons, Vite, ESLint, and fonts.)*

### 2. Configure Environment
Create the local environment file and set the backend URL:
```powershell
Copy-Item .env.example .env.local
```
Inside `.env.local`, ensure the backend URL is set:
```env
VITE_API_BASE_URL=http://127.0.0.1:5000/api
```

### 3. Run the Frontend Server
```powershell
npm.cmd run dev
```

### 4. Git Workflow & Pre-checks
Before sharing or pushing changes, always run the linter and build check:
```powershell
npm.cmd run lint
npm.cmd run build
```
*(Note: If PowerShell blocks `npm`, always use `npm.cmd` as shown above).*

**Branching:** Create a separate Git branch for your work:
```powershell
git checkout -b frontend-updates
```
Commit only the frontend changes you have made to this branch.
