# AARNA OC Recruitment API

The backend is a Flask API for AARNA Club's Organising Committee recruitment. PostgreSQL is the source of truth for applications; Google Sheets is a delayed, reviewer-friendly copy maintained by the sync command.

## Architecture

```text
backend/
├── app/
│   ├── __init__.py          # Application factory, extensions, errors and blueprints
│   ├── config.py            # Environment-based configuration
│   ├── constants.py         # Portfolio names, years and Sheet columns
│   ├── models.py            # Application and SheetSyncRun ORM models
│   ├── schemas.py           # Input validation and normalization
│   ├── auth.py              # Signed reviewer-token authentication
│   ├── repositories/        # Database query helpers
│   ├── api/                 # Public and reviewer HTTP routes
│   ├── services/sheets.py   # Google Sheets batch synchronizer
│   └── commands.py          # Flask CLI commands
├── migrations/              # Alembic/Flask-Migrate revisions
├── scripts/start.sh         # Render startup (migrate, then Gunicorn)
├── tests/                   # API and Sheets-service tests
├── .env.example             # Configuration template (copy to .env)
└── wsgi.py                  # Production WSGI entry point
```

## Request and sync flow

1. The React form sends one JSON request to `POST /api/applications`.
2. The schema validator trims text, lowercases the college email, normalizes the phone number, checks the allowed domain, validates the year and portfolio values, and ensures the two portfolio choices differ.
3. The API checks the unique normalized email and phone indexes, writes the application to PostgreSQL, and returns an immutable application UUID. The record starts with `syncState: pending`.
4. A Render Cron Job (or a local CLI command) runs every 15 minutes. The Sheets service reads UUIDs already in column A, appends only missing rows, and marks successful database records as `synced`. This makes retries safe after an interrupted job.
5. A reviewer signs in with the admin password. The API returns a short-lived signed bearer token. The dashboard uses that token for read-only application and sync-status requests.

## API reference

All request and response bodies are JSON. Errors use the shape `{ "error": { "code": "...", "message": "...", "fields": {} } }`.

| Method | Endpoint | Authentication | Purpose |
|---|---|---|---|
| GET | `/api/health` | None | Database health check. |
| GET | `/api/application-options` | None | Returns the eight portfolios and the eligible year (second year). |
| POST | `/api/applications` | None | Validates and stores one application. |
| POST | `/api/admin/session` | Password in JSON | Creates a reviewer bearer token. |
| GET | `/api/admin/applications` | `Authorization: Bearer <token>` | Search/filter read-only applications. |
| GET | `/api/admin/sync-status` | `Authorization: Bearer <token>` | Pending count and latest Sheets sync audit record. |

### Submit an application

```json
{
  "fullName": "Aarna Student",
  "collegeEmail": "student@college.edu",
  "phone": "9876543210",
  "rollNumber": "23CS001",
  "academicDepartment": "Computer Science",
  "year": 2,
  "section": "A",
  "primaryPortfolio": "Technical team",
  "secondaryPortfolio": "Designing team",
  "skills": "React, Python",
  "experience": "Built a club website",
  "motivation": "I want to contribute to AARNA."
}
```

The response includes `applicationId`, `submittedAt`, `syncStatus`, and a confirmation message. Email and phone duplicates return HTTP 409; invalid fields return HTTP 400.

### Reviewer requests

Send `{ "password": "..." }` to `/api/admin/session`. The response contains `token` and `expiresAt`. Use the token in subsequent requests. Applications accepts `q`, `year`, `portfolio`, `syncState`, `limit`, and `offset` query parameters. The response includes `items` and pagination metadata.

## Important functions

- `create_app()` wires configuration, SQLAlchemy, migrations, CORS, error handlers, blueprints, and CLI commands.
- `_database_url()` normalizes Render's PostgreSQL URL to the psycopg SQLAlchemy dialect.
- `validate_application_payload()` is the single boundary for required fields, allowed email domain, phone normalization, portfolio membership, and cross-field rules.
- `create_admin_token()` signs a reviewer role with `itsdangerous`; `require_admin` validates the bearer token and expiry before protected routes run.
- `find_contact_conflict()` performs the email/phone uniqueness lookup; `reviewer_query()`, `pending_sync_query()`, and `latest_sync_run_query()` keep database filtering out of route handlers.
- `GoogleSheetsSynchronizer._service()` creates the Google API client from service-account JSON; `_existing_ids()` reads UUIDs already present; `_ensure_header()` initializes an empty tab; `sync()` appends missing rows, updates sync state, and writes an audit row.
- Public route handlers expose health, options, and submission. Admin route handlers create sessions, list applications, and report sync health. `register_commands()` exposes `flask sync-sheets`.

The module docstrings and inline comments describe the purpose of each implementation block; this README explains how those blocks work together.

## Run locally on Windows

Prerequisites: Python 3.11+, PostgreSQL (or the bundled SQLite fallback), and Git.

```powershell
cd C:\path\to\flask_react\backend
py -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `.env` before starting. For PostgreSQL use a real URL such as:

```text
DATABASE_URL=postgresql+psycopg://postgres:yourPassword@localhost:5432/aarna_recruitment
ALLOWED_EMAIL_DOMAIN=your-college-domain.ac.in
ADMIN_PASSWORD=choose-a-strong-password
TOKEN_SECRET=use-a-long-random-secret
CORS_ORIGIN=http://localhost:5173
```

Run migrations and the API:

```powershell
.\venv\Scripts\python.exe -m flask --app wsgi db upgrade
.\venv\Scripts\python.exe -m flask --app wsgi run --debug --port 5000
```

If `DATABASE_URL` is omitted, SQLite is used for a quick local demo. Seeing `SQLiteImpl` in migration output means the application is using SQLite, not PostgreSQL; check that `.env` is in `backend/` and that the URL is correct.

## Google Sheets setup

1. Create a Google Cloud project and enable the Google Sheets API.
2. Create a service account, download its JSON key, and share the target spreadsheet with the key's `client_email` as Editor.
3. Set `GOOGLE_SHEET_ID` to the ID between `/d/` and `/edit` in the Sheet URL and set `GOOGLE_SHEET_TAB=Applications`.
4. Set `GOOGLE_SERVICE_ACCOUNT_JSON` to the **actual JSON text**, not a filename and not a PowerShell command. For a temporary PowerShell session:

```powershell
$credentialPath = "C:\actual\path\service-account.json"
$env:GOOGLE_SERVICE_ACCOUNT_JSON = Get-Content -Raw -LiteralPath $credentialPath
.\venv\Scripts\python.exe -m flask --app wsgi sync-sheets
```

The path must be replaced with the location where the key was actually downloaded. Never commit the JSON key or `.env` file. A sync failure caused by empty/invalid JSON means the environment variable was not populated with the file contents.

## Tests and operations

```powershell
.\venv\Scripts\python.exe -m pytest -q
.\venv\Scripts\python.exe -m flask --app wsgi sync-sheets
```

The sync command is safe to retry. Configure a Render Cron Job with command `flask --app wsgi sync-sheets` and schedule `*/15 * * * *` (UTC), using the same database and Google secrets as the web service. Render's web service runs `scripts/start.sh`, which applies migrations and starts Gunicorn.

## Configuration checklist

Required in deployment: `DATABASE_URL`, `ALLOWED_EMAIL_DOMAIN`, `ADMIN_PASSWORD`, `TOKEN_SECRET`, `CORS_ORIGIN`, `GOOGLE_SHEET_ID`, `GOOGLE_SHEET_TAB`, and `GOOGLE_SERVICE_ACCOUNT_JSON`. Keep secrets in Render environment settings, restrict `CORS_ORIGIN` to the deployed frontend, and do not expose reviewer endpoints without the bearer token. OC recruitment currently accepts second-year applications only.
