/** Root routing and theme setup for the AARNA recruitment experience. */
import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { SiteShell } from './components/SiteShell'
import { useTheme } from './hooks/useTheme'
import { ApplyPage } from './pages/ApplyPage'
import { HomePage } from './pages/HomePage'
import { AdminLogin } from './pages/admin/AdminLogin'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'

import { api } from './api/client'

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
      <SiteShell theme={theme} setTheme={setTheme}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/apply" element={<ApplyPage />} />
          <Route path="/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </SiteShell>
    </BrowserRouter>
  )
}

export default App
