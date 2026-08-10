/** Root routing and theme setup for the AARNA recruitment experience. */
import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { SiteShell } from './components/SiteShell'
import { useTheme } from './hooks/useTheme'
import { ApplyPage } from './pages/ApplyPage'
import { DashboardPage } from './pages/DashboardPage'
import { HomePage } from './pages/HomePage'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function App() {
  const { theme, setTheme } = useTheme()

  return (
    <BrowserRouter>
      <ScrollToTop />
      <SiteShell theme={theme} setTheme={setTheme}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/apply" element={<ApplyPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </SiteShell>
    </BrowserRouter>
  )
}

export default App
