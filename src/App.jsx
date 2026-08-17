/** Root routing and theme setup for the AARNA recruitment experience. */
import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { SiteShell } from './components/SiteShell'
import { useTheme } from './hooks/useTheme'
import { HomePage } from './pages/HomePage'
import { api } from './api/client'

// Lazy-loaded routes for code-splitting
const ApplyPage = lazy(() => import('./pages/ApplyPage').then((m) => ({ default: m.ApplyPage })))
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin').then((m) => ({ default: m.AdminLogin })))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })))
const LiveLeaderboardPage = lazy(() => import('./pages/admin/LiveLeaderboardPage').then((m) => ({ default: m.LiveLeaderboardPage })))
const AudienceDisplayPage = lazy(() => import('./pages/AudienceDisplayPage').then((m) => ({ default: m.AudienceDisplayPage })))

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-subtle)' }}>
      <div className="pulse-loader" style={{ fontSize: '0.9rem', letterSpacing: '0.05em' }}>Loading...</div>
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function App() {
  const { theme, setTheme } = useTheme()

  // Wake up backend silently as soon as user lands on the website
  useEffect(() => {
    if (!sessionStorage.getItem('aarna_warmup')) {
      api.wakeup()
      sessionStorage.setItem('aarna_warmup', 'true')
    }
  }, [])

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Audience Standalone Live Event Screen Routes */}
          <Route path="/display" element={<AudienceDisplayPage />} />
          <Route path="/audience" element={<AudienceDisplayPage />} />
          <Route path="/stage" element={<AudienceDisplayPage />} />
          <Route path="/live-display" element={<AudienceDisplayPage />} />

          {/* Admin Standalone Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/live" element={<LiveLeaderboardPage />} />
          <Route path="/admin/live-game" element={<LiveLeaderboardPage />} />
          <Route path="/live" element={<LiveLeaderboardPage />} />
          <Route path="/leaderboard" element={<LiveLeaderboardPage />} />

          {/* Public Site Routes Wrapped in SiteShell */}
          <Route
            path="/*"
            element={
              <SiteShell theme={theme} setTheme={setTheme}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/apply" element={<ApplyPage />} />
                  <Route path="*" element={<HomePage />} />
                </Routes>
              </SiteShell>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
