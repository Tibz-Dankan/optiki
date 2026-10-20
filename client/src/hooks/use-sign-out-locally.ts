import { useNavigate } from 'react-router-dom'
import { useAppearanceStore } from '@stores/appearance'
import { useAuthStore } from '@stores/auth'

export function useSignOutLocally(): () => void {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const clearAppearance = useAppearanceStore((state) => state.clearAppearance)

  return () => {
    clearAuth()
    clearAppearance()
    navigate('/auth/signin', { replace: true })
  }
}
