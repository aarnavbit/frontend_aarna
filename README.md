# AARNA Web Platform & Live Flipcard Game Challenge

Full-stack interactive web platform for AARNA featuring the main recruitment experience and an isolated, high-performance live event card matching challenge.

---

## 🌐 Application Architecture & Routes

| URL Route | Destination | Description |
| :--- | :--- | :--- |
| `/` | **AARNA Main Site** | Full interactive React experience (Home, Application, Admin) |
| `/apply` | **Recruitment Form** | Application submission and screening portal |
| `/dashboard` | **Reviewer Dashboard** | Candidate evaluation & scoring system |
| `/flipcard` | **FlipMatch Game** | Ultra-lightweight live event card matching game challenge |
| `/flipcard/admin` | **FlipMatch Admin** | Real-time event controller, live leaderboard, and CSV export |

---

## ⚡ Zero Cross-Bandwidth Footprint

The applications are strictly separated for optimal performance and bandwidth efficiency:
- **Main Website Visitors**: Never download the Flipcard game assets (0 KB extra overhead).
- **Flipcard Players**: Only download **~100 KB total** (pure static HTML/CSS/JS). Never download the React framework bundle.
- **Cloudflare Edge Caching**: Assets under `/assets/*`, `/flipcard/css/*`, and `/flipcard/js/*` are served with `Cache-Control: public, max-age=31536000, immutable`.

---

## ⚙️ Flipcard Game API Endpoint Configuration

The game dynamically discovers the backend API:
1. **Query Parameter**: Append `?api=https://your-backend.com` to any `/flipcard` or `/flipcard/admin` URL.
2. **Global Variable**: Define `window.__GAME_API_URL__ = 'https://your-backend.com'`.
3. **Automatic Fallback**: Resolves to `window.location.origin` in production environments or `http://localhost:3000` in local testing.

---

## 🛠️ Local Development & Production Build

```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev

# Build production bundle to dist/
npm run build

# Preview production build locally
npm run preview
```
