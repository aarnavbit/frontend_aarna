/** Persist the AARNA light/dark preference while respecting a first-visit system setting. */

import { useEffect, useState } from 'react'

const storageKey = 'aarna-theme'

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem(storageKey)
    if (savedTheme) return savedTheme
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(storageKey, theme)
  }, [theme])

  return { theme, setTheme }
}
