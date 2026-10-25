import { authAPI } from '@api/auth'
import { useAnonymousStore } from '@stores/anonymous'
import { useAppearanceStore } from '@stores/appearance'
import { useAuthStore } from '@stores/auth'

const SIGN_IN_PATH = '/auth/signin'

let isEndingSession = false

const getPathAfterSessionEnd = ({ pathname }: Location): string => {
  if (!pathname.startsWith('/u/')) return SIGN_IN_PATH
  return `${SIGN_IN_PATH}?redirectTo=${encodeURIComponent(pathname)}`
}

export async function endSession(): Promise<void> {
  if (isEndingSession) return
  isEndingSession = true

  const nextPath = getPathAfterSessionEnd(window.location)

  useAuthStore.getState().clearAuth()
  useAppearanceStore.getState().clearAppearance()
  useAnonymousStore.getState().clearAnonymousID()

  await authAPI.signOut().catch(() => undefined)

  window.location.replace(nextPath)
}
