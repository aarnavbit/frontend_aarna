# Flipcards Live Event Game — Frontend

Ultra-lightweight, high-performance card matching game interface designed for live event challenges, with dynamic leaderboards, resilient offline queueing, and near-zero bandwidth footprint.

## 🚀 Cloudflare Pages Deployment

This repository is optimized for instant deployment on Cloudflare Pages:
- **Framework Preset**: None / Static / Custom
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Payload Size**: < 100 KB (Zero heavy node_modules dependencies, zero runtime JS framework overhead)

## 🔄 React Website Backup

The previous React-based website is safely preserved in the remote branch:
```bash
git checkout website-react-backup
```
To switch back to the React website in the future:
```bash
git checkout website-react-backup
git branch -M main
git push -u origin main --force
```

## ⚙️ Backend API Configuration

The frontend automatically resolves the backend endpoint:
1. **URL Parameter Override**: Append `?api=https://your-backend.domain` to the URL.
2. **Global Variable Override**: Set `window.__GAME_API_URL__ = 'https://your-backend.domain'`.
3. **Automatic Fallback**: Defaults to `window.location.origin` in production environments or `http://localhost:3000` in local testing.

## 🛠️ Local Development & Build

```bash
# Build static bundle to dist/
npm run build

# Preview locally
node scripts/build.js
```
