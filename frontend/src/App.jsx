/** Root routing and theme setup for the AARNA recruitment experience. */
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { SiteShell } from './components/SiteShell'
import { useTheme } from './hooks/useTheme'
import { ApplyPage } from './pages/ApplyPage'
import { DashboardPage } from './pages/DashboardPage'
import { HomePage } from './pages/HomePage'

function App() {
  const { theme, setTheme } = useTheme()

  return (
    <BrowserRouter>
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
