import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { TAuthResponse } from '@typings/auth'
import { useAuthStore } from '@stores/auth'
import { endSession } from '@utils/end-session'
import { reconcileAnonymousUser } from '@utils/reconcile-anonymous-user'
import { refreshSession } from '@utils/refresh-session'

const REFRESH_THRESHOLD_MS = 15 * 60 * 1000
const CHECK_INTERVAL_MS = 10_000

const getTime = (date: string): number => new Date(date).getTime()

export const useSessionRefresh = () => {
  const queryClient = useQueryClient()
  const session = useAuthStore((state) => state.auth.session)
  const updateSession = useAuthStore((state) => state.updateSession)

  const { mutate, isPending } = useMutation({
    mutationFn: refreshSession,
    onSuccess: (data: TAuthResponse) => {
      updateSession({
        userID: data.session.userID,
        accessTokenExpiresAt: data.session.accessTokenExpiresAt,
        refreshTokenExpiresAt: data.session.refreshTokenExpiresAt,
      })
      reconcileAnonymousUser(data.session.userID, queryClient)
    },
  })

  useEffect(() => {
    const checkSession = () => {
      const { accessTokenExpiresAt, refreshTokenExpiresAt } = session
      if (!accessTokenExpiresAt || !refreshTokenExpiresAt) return

      if (getTime(refreshTokenExpiresAt) <= Date.now()) {
        endSession()
        return
      }

      const isAccessExpiringSoon =
        getTime(accessTokenExpiresAt) - Date.now() <= REFRESH_THRESHOLD_MS
      const canExtendAccess =
        getTime(accessTokenExpiresAt) < getTime(refreshTokenExpiresAt)

      if (isAccessExpiringSoon && canExtendAccess && !isPending) mutate()
    }

    checkSession()
    const intervalId = setInterval(checkSession, CHECK_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [session, isPending, mutate])
}
