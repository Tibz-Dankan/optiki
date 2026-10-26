import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { TAppearanceResponse, TTheme } from '@typings/appearance'
import { appearanceAPI, appearanceKeys } from '@api/appearance'
import { useAppearanceStore } from '@stores/appearance'
import { useAuthStore } from '@stores/auth'
import { getCookie, removeCookie, setCookie } from '@utils/cookies'

type ResolvedTheme = Exclude<TTheme, 'system'>

const DEFAULT_THEME = 'dark'
const THEME_COOKIE_NAME = 'optiki-ui-theme'
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: TTheme
  storageKey?: string
}

type ThemeProviderState = {
  defaultTheme: TTheme
  resolvedTheme: ResolvedTheme
  theme: TTheme
  setTheme: (theme: TTheme) => void
  resetTheme: () => void
}

const initialState: ThemeProviderState = {
  defaultTheme: DEFAULT_THEME,
  resolvedTheme: 'dark',
  theme: DEFAULT_THEME,
  setTheme: () => null,
  resetTheme: () => null,
}

const ThemeContext = createContext<ThemeProviderState>(initialState)

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = DEFAULT_THEME,
  storageKey = THEME_COOKIE_NAME,
  ...props
}) => {
  const [theme, _setTheme] = useState<TTheme>(
    () => (getCookie(storageKey) as TTheme) || defaultTheme
  )

  const queryClient = useQueryClient()
  const updateAppearance = useAppearanceStore((state) => state.updateAppearance)

  const onAppearanceSaved = (response: TAppearanceResponse) => {
    updateAppearance(response.data)
    queryClient.invalidateQueries({ queryKey: appearanceKeys.all })
  }

  const { mutate: createAppearance } = useMutation({
    mutationFn: appearanceAPI.create,
    onSuccess: onAppearanceSaved,
  })

  const { mutate: saveAppearance } = useMutation({
    mutationFn: appearanceAPI.update,
    onSuccess: onAppearanceSaved,
  })

  const syncAppearance = (theme: TTheme) => {
    const isSignedIn = !!useAuthStore.getState().auth.session?.userID
    if (!isSignedIn) return

    const { appearance } = useAppearanceStore.getState()

    // Without this, applying a theme we just fetched would PATCH it straight back.
    if (appearance.theme === theme) return

    if (appearance.id) {
      saveAppearance({ id: appearance.id, theme })
      return
    }
    createAppearance({ theme })
  }

  const resolvedTheme = useMemo((): ResolvedTheme => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    }
    return theme as ResolvedTheme
  }, [theme])

  useEffect(() => {
    const root = window.document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const applyTheme = (currentResolvedTheme: ResolvedTheme) => {
      root.classList.remove('light', 'dark')
      root.classList.add(currentResolvedTheme)
    }

    const handleChange = () => {
      if (theme === 'system') {
        applyTheme(mediaQuery.matches ? 'dark' : 'light')
      }
    }

    applyTheme(resolvedTheme)
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, resolvedTheme])

  const setTheme = (theme: TTheme) => {
    setCookie(storageKey, theme, THEME_COOKIE_MAX_AGE)
    _setTheme(theme)
    syncAppearance(theme)
  }

  const resetTheme = () => {
    removeCookie(storageKey)
    _setTheme(DEFAULT_THEME)
    syncAppearance(DEFAULT_THEME)
  }

  const contextValue = {
    defaultTheme,
    resolvedTheme,
    resetTheme,
    theme,
    setTheme,
  }

  return (
    <ThemeContext value={contextValue} {...props}>
      {children}
    </ThemeContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext)

  if (!context) throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
