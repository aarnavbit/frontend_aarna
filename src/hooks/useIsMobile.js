import { useSyncExternalStore, useCallback } from 'react'

/**
 * Responsive viewport detection hook using React 19 useSyncExternalStore.
 * Listens to media query change events and cleans up subscriptions on unmount.
 *
 * @param {number} [breakpoint=768] - Maximum viewport width in pixels to consider mobile.
 * @returns {boolean} Whether the viewport matches the mobile media query.
 */
export function useIsMobile(breakpoint = 768) {
  const subscribe = useCallback(
    (onStoreChange) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return () => {}
      }
      const query = window.matchMedia(`(max-width: ${breakpoint}px)`)
      if (typeof query.addEventListener === 'function') {
        query.addEventListener('change', onStoreChange)
        return () => query.removeEventListener('change', onStoreChange)
      } else if (typeof query.addListener === 'function') {
        query.addListener(onStoreChange)
        return () => query.removeListener(onStoreChange)
      }
      return () => {}
    },
    [breakpoint]
  )

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false
    }
    return window.matchMedia(`(max-width: ${breakpoint}px)`).matches
  }, [breakpoint])

  const getServerSnapshot = useCallback(() => false, [])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}


