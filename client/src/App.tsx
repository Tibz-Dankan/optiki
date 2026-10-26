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
import { Gym } from '@modules/gym/pages/gym'
import { Home } from '@modules/home/pages/home'
import { Rule } from '@modules/rules/pages/rule'
import { Rules } from '@modules/rules/pages/rules'
import { Scan } from '@modules/scan/pages/scan'
import { ScanReport } from '@modules/scan/pages/scan-report'
import { PageCapturer } from '@modules/shared/ui/page-capturer'

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
      <PageCapturer />
      {!isLoggedIn && (
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/scan' element={<Scan />} />
          <Route path='/scans/:id' element={<ScanReport />} />
          <Route path='/rules' element={<Rules />} />
          <Route path='/rules/:id' element={<Rule />} />
          <Route path='/gym' element={<Gym />} />
          <Route path='/*' element={<AuthRoutes />} />
        </Routes>
      )}

      {isLoggedIn &&
        !isUserResolved &&
        (isGetMeError ? <GeneralError /> : <LoadingPage />)}

      {isLoggedInUnverified && (
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/scan' element={<Scan />} />
          <Route path='/scans/:id' element={<ScanReport />} />
          <Route path='/rules' element={<Rules />} />
          <Route path='/rules/:id' element={<Rule />} />
          <Route path='/gym' element={<Gym />} />
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
          <Route path='/scan' element={<Navigate to='/u/scan' replace />} />
          <Route path='/scans/:id' element={<ScanReport />} />
          <Route path='/rules' element={<Rules />} />
          <Route path='/rules/:id' element={<Rule />} />
          <Route path='/gym' element={<Gym />} />
          <Route path='/auth/*' element={<Navigate to='/u/scan' replace />} />
          <Route path='/*' element={<RenderUserRoutes />} />
        </Routes>
      )}
    </BrowserRouter>
  )
}
