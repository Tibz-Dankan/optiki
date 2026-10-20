import { useEffect, useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { appearanceAPI, appearanceKeys } from '@api/appearance'
import { isHttpError } from '@api/http-error'
import { useAppearanceStore } from '@stores/appearance'
import { useAuthStore } from '@stores/auth'
import { useTheme } from '@providers/theme'

export const useGetAppearance = () => {
  const session = useAuthStore((state) => state.auth.session)
  const appearance = useAppearanceStore((state) => state.appearance)
  const updateAppearance = useAppearanceStore((state) => state.updateAppearance)
  const { theme, setTheme } = useTheme()

  const isSignedIn = !!session?.userID
  const hasAppearance = !!appearance.id

  const { data, error } = useQuery({
    queryKey: appearanceKeys.me(),
    queryFn: appearanceAPI.getMine,
    enabled: isSignedIn && !hasAppearance,
    retry: false,
  })

  const { mutate: createAppearance } = useMutation({
    mutationFn: appearanceAPI.create,
    onSuccess: (response) => updateAppearance(response.data),
  })

  useEffect(() => {
    if (!data?.data) return

    updateAppearance(data.data)
    setTheme(data.data.theme)
  }, [data, updateAppearance, setTheme])

  // StrictMode double-invokes effects in dev; the row must not be created twice.
  const hasCreated = useRef(false)

  useEffect(() => {
    if (hasCreated.current) return
    if (!isHttpError(error) || error.status !== 404) return

    hasCreated.current = true
    createAppearance({ theme })
  }, [error, createAppearance, theme])
}
