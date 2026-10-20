import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '@stores/auth'
import { useGetAppearance } from '@hooks/use-get-appearance'
import { useGetMe } from '@hooks/use-get-me'
import { useGlobalRequestInterceptor } from '@hooks/use-global-request-interceptor'
import { useIsAuthenticatedPath } from '@hooks/use-is-authenticated-path'
import { useSessionRefresh } from '@hooks/use-session-refresh'
import { AuthRoutes } from '@routes/auth-routes'
import { RenderUserRoutes } from '@routes/render-user-routes'
import { GeneralError } from '@shared/pages/general-error'
import { LoadingPage } from '@shared/pages/loading-page'
import { VerifyEmail } from '@modules/auth/pages/verify-email'
import { Home } from '@modules/home/pages/home'

export const App: React.FC = () => {
  const { isAuthenticatedPath } = useIsAuthenticatedPath()
  const session = useAuthStore((state) => state.auth.session)
  const user = useAuthStore((state) => state.auth.user)
  const isLoggedIn = !!session?.userID

  useGlobalRequestInterceptor()
  useSessionRefresh()
  const { isError: isGetMeError, isLoading: isLoadingGetMe } = useGetMe()
  useGetAppearance()

  // Sign-in only returns a session; emailVerified arrives with getMe, so the tree must wait for it.
  const isUserResolved = !!user.id && !isLoadingGetMe
  const isLoggedInUnverified =
    isLoggedIn && isUserResolved && !user.emailVerified
  const isLoggedInUser = isLoggedIn && isUserResolved && user.emailVerified

  if (
    isAuthenticatedPath &&
    (isLoadingGetMe || (!isLoggedIn && !isGetMeError))
  ) {
    return <LoadingPage />
  }

  return (
    <BrowserRouter>
      {!isLoggedIn && (
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/*' element={<AuthRoutes />} />
        </Routes>
      )}

      {isLoggedIn &&
        !isUserResolved &&
        (isGetMeError ? <GeneralError /> : <LoadingPage />)}

      {isLoggedInUnverified && (
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/auth/verify-email' element={<VerifyEmail />} />
          <Route
            path='*'
            element={<Navigate to='/auth/verify-email' replace />}
          />
        </Routes>
      )}

      {isLoggedInUser && (
        <Routes>
          <Route path='/' element={<Home />} />
          <Route
            path='/auth/*'
            element={<Navigate to='/u/dashboard' replace />}
          />
          <Route path='/*' element={<RenderUserRoutes />} />
        </Routes>
      )}
    </BrowserRouter>
  )
}
