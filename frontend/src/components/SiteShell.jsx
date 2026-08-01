/** Shared navigation, theme control, and footer for all public AARNA routes. */

import { Moon, Sun } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import aarnaLogo from '../assets/aarna.jpg'

function ThemeToggle({ theme, setTheme }) {
  const isDark = theme === 'dark'
  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
    </button>
  )
}

export function SiteShell({ children, theme, setTheme }) {
  return (
    <div className="site-shell">
      <header className="site-header">
        <NavLink className="brand" to="/" aria-label="AARNA Club home">
          <span className="brand-mark"><img src={aarnaLogo} alt="" /></span>
          <span>
            <strong>AARNA</strong>
            <small>Freelancing Club</small>
          </span>
        </NavLink>
        <nav className="site-nav" aria-label="Main navigation">
          <NavLink end to="/">Home</NavLink>
          <NavLink to="/#portfolios">Portfolios</NavLink>
          <NavLink to="/apply">Apply</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
        </nav>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <span>© {new Date().getFullYear()} AARNA Club</span>
        <span>Turning Passions into Profits</span>
      </footer>
    </div>
  )
}
