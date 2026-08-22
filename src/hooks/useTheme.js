/**
 * Persist the AARNA light/dark preference while respecting a first-visit system setting.
 */
import { useEffect, useState, useCallback } from 'react'

const STORAGE_KEY = 'aarna-theme'

/**
 * Retrieves the initial theme from localStorage or system preference.
 * @returns {'dark' | 'light'}
 */
function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark'
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'dark' || saved === 'light') return saved
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light'
    }
  } catch {
    // localStorage might be unavailable or throw SecurityError in private windows
  }
  return 'dark'
}

/**
 * Hook for managing application-wide dark / light theme state.
 * Syncs with document dataset and localStorage.
 *
 * @returns {{ theme: string, setTheme: (theme: string | ((prev: string) => string)) => void }}
 */
export function useTheme() {
  const [theme, setThemeState] = useState(getInitialTheme)

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Safe fallback if storage quota exceeded or storage disabled
    }
  }, [theme])

  const setTheme = useCallback((newTheme) => {
    setThemeState((prev) => {
      const resolved = typeof newTheme === 'function' ? newTheme(prev) : newTheme
      return resolved === 'light' ? 'light' : 'dark'
    })
  }, [])

  return { theme, setTheme }
}

