import { useNavigate } from 'react-router-dom'
import { useAnonymousStore } from '@stores/anonymous'
import { useAppearanceStore } from '@stores/appearance'
import { useAuthStore } from '@stores/auth'

export function useSignOutLocally(): () => void {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const clearAppearance = useAppearanceStore((state) => state.clearAppearance)
  const clearAnonymousID = useAnonymousStore((state) => state.clearAnonymousID)

  return () => {
    clearAuth()
    clearAppearance()
    clearAnonymousID()
    navigate('/auth/signin', { replace: true })
  }
}
