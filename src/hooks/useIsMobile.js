import { useEffect, useState } from 'react'

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(`(max-width: ${breakpoint}px)`).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const query = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const updateMatch = () => setIsMobile(query.matches)

    updateMatch()
    query.addEventListener('change', updateMatch)

    return () => query.removeEventListener('change', updateMatch)
  }, [breakpoint])

  return isMobile
}
