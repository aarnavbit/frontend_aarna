# AARNA OC Recruitment Frontend

Vite + React experience for AARNA Club's OC recruitment.

## Local setup

Run: npm install

Create a .env.local file with this public API URL:

VITE_API_BASE_URL=http://127.0.0.1:5000/api

Use npm run dev for local development. Run npm run lint and npm run build before deployment.

## Cloudflare Pages

Create a Pages project connected to this repository:

- Root directory: frontend
- Build command: npm run build
- Build output directory: dist
- Environment variable: VITE_API_BASE_URL=https://your-render-service.onrender.com/api

The public/_redirects file supports direct visits to application and dashboard routes. VITE_API_BASE_URL is deliberately public; never put secrets in a Vite environment variable.
