import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { siteVisitAPI } from '@api/site-visit'
import { getAnonymousID } from '@utils/get-anonymous-id'
import { getBrowserLabel } from '@utils/get-browser-label'

let lastCapturedPath = ''

export const useCapturePageVisit = () => {
  const { pathname } = useLocation()

  const { mutate } = useMutation({
    mutationFn: siteVisitAPI.post,
    // Overrides the global error toast: a failed capture must never reach the visitor.
    onError: () => {},
  })

  useEffect(() => {
    // Remounts (StrictMode, App swapping route trees) re-run this for a path already captured.
    if (pathname === lastCapturedPath) return
    lastCapturedPath = pathname

    mutate({
      path: pathname,
      capturedAt: new Date().toISOString(),
      anonymousID: getAnonymousID(),
      device: getBrowserLabel(navigator.userAgent),
    })
  }, [pathname, mutate])
}
