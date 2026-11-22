import { useSyncExternalStore } from 'react'

/** True when the CSS media query matches (re-renders on change). */
export function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query)
      m.addEventListener('change', cb)
      return () => m.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Desktop layout (design D00–D08) from 1024 px. Below that: the phone layout. */
export const useDesktop = () => useMedia('(min-width: 1024px)')
