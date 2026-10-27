import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

export const useNavigationScroll = (isReady: boolean) => {
  const { pathname, hash } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (!hash && navigationType === 'PUSH') window.scrollTo(0, 0)
  }, [pathname, hash, navigationType])

  useEffect(() => {
    if (!hash || !isReady) return
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView()
  }, [hash, isReady])
}
