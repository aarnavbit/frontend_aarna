# AARNA Recruitment API

Flask API for the public OC application flow, password-protected reviewer data, PostgreSQL storage, and scheduled Google Sheets export.

## Local setup

1. Create and activate a virtual environment, then run: pip install -r requirements.txt
2. Copy .env.example to .env and set an actual college email domain, reviewer password, and long token secret.
3. Run: flask --app wsgi db upgrade
4. Run: flask --app wsgi run --debug

Run API tests with: pytest

## Render deployment

Create a Render PostgreSQL database and a Python Web Service with root directory: backend

- Build command: pip install -r requirements.txt
- Start command: sh scripts/start.sh
- Health check path: /api/health

Set DATABASE_URL, ALLOWED_EMAIL_DOMAIN, ADMIN_PASSWORD, TOKEN_SECRET, CORS_ORIGIN, GOOGLE_SHEET_ID, GOOGLE_SHEET_TAB, and GOOGLE_SERVICE_ACCOUNT_JSON as service environment variables. CORS_ORIGIN must be the Cloudflare Pages production URL.

Create a separate Render Cron Job from the same backend root:

- Build command: pip install -r requirements.txt
- Command: flask --app wsgi sync-sheets
- Schedule: */15 * * * *

Enable the Google Sheets API in a Google Cloud project, create a service account, share the target Sheet with that service-account email as an editor, and store the full service-account JSON in GOOGLE_SERVICE_ACCOUNT_JSON. The first sync writes the header row when the selected tab is empty.
