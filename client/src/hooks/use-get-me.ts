import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { TGetMeResponse } from '@typings/auth'
import { authAPI, authKeys } from '@api/auth'
import { isHttpError } from '@api/http-error'
import { useAuthStore } from '@stores/auth'
import { refreshSession } from '@utils/refresh-session'
import { useIsAuthenticatedPath } from '@hooks/use-is-authenticated-path'

const getMe = async (): Promise<TGetMeResponse> => {
  try {
    return await authAPI.getMe()
  } catch (error) {
    if (!isHttpError(error) || error.status !== 401) throw error
    await refreshSession()
    return authAPI.getMe()
  }
}

export const useGetMe = () => {
  const { isAuthenticatedPath } = useIsAuthenticatedPath()
  const hasSession = useAuthStore((state) => !!state.auth.session.userID)
  const updateUser = useAuthStore((state) => state.updateUser)
  const updateSession = useAuthStore((state) => state.updateSession)

  const { data, isPending, isLoading, isError, error, refetch } = useQuery({
    queryKey: authKeys.me(),
    queryFn: getMe,
    enabled: hasSession || isAuthenticatedPath,
  })

  useEffect(() => {
    if (data?.user) {
      updateUser(data.user)
    }
    if (data?.session) {
      updateSession(data.session)
    }
  }, [data, updateUser, updateSession])

  return {
    user: data?.user ?? null,
    isPending,
    isLoading,
    isError,
    error,
    refetch,
  }
}
