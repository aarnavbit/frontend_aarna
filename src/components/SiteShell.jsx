/** Shared navigation, theme control, and footer for all public AARNA routes. */

import { useState, useEffect } from 'react'
import { Menu, Moon, Sun, X } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  // Close drawer on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location])

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  return (
    <div className="site-shell">
      <header className="site-header">
        <NavLink className="brand" to="/" aria-label="AARNA Club home">
          <img src="/Logo.png" alt="AARNA Logo" className="brand-logo-img" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <span>
            <strong>AARNA</strong>
            <small>Freelancing Club</small>
          </span>
        </NavLink>

        {/* Desktop Navigation */}
        <nav className="site-nav desktop-nav" aria-label="Main navigation">
          <NavLink end to="/">Home</NavLink>
          <NavLink to="/#portfolios">Portfolios</NavLink>
          <NavLink to="/apply">Apply</NavLink>
        </nav>

        <div className="header-actions">
          <ThemeToggle theme={theme} setTheme={setTheme} />
          
          <button
            className="mobile-menu-toggle"
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              className="mobile-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.nav
              className="mobile-drawer"
              aria-label="Mobile navigation"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            >
              <div className="mobile-drawer-header">
                <div className="brand">
                  <span className="brand-mark" style={{ background: '#513369', borderRadius: '50%' }}></span>
                  <span>
                    <strong>AARNA</strong>
                    <small>Menu</small>
                  </span>
                </div>
                <button
                  className="mobile-drawer-close"
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mobile-drawer-links">
                <NavLink end to="/" onClick={() => setIsMobileMenuOpen(false)}>Home</NavLink>
                <NavLink to="/#portfolios" onClick={() => setIsMobileMenuOpen(false)}>Portfolios</NavLink>
                <NavLink to="/apply" onClick={() => setIsMobileMenuOpen(false)}>Apply</NavLink>
              </div>

              <div className="mobile-drawer-footer">
                <div className="drawer-theme-row">
                  <span>Appearance</span>
                  <ThemeToggle theme={theme} setTheme={setTheme} />
                </div>
                <small>© {new Date().getFullYear()} AARNA Club</small>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      <main>{children}</main>
      <footer className="site-footer">
        <span>© {new Date().getFullYear()} AARNA Club</span>
        <span>Turning Passions into Profits</span>
      </footer>
    </div>
  )
}

