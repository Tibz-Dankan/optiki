import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ForgotPassword } from '@modules/auth/pages/forgot-password'
import { ResetPassword } from '@modules/auth/pages/reset-password'
import { SignIn } from '@modules/auth/pages/sign-in'
import { SignUp } from '@modules/auth/pages/sign-up'
import { VerifyEmail } from '@modules/auth/pages/verify-email'
import { VerifyOtp } from '@modules/auth/pages/verify-otp'

export const AuthRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path='/auth/signin' element={<SignIn />} />
      <Route path='/auth/signup' element={<SignUp />} />
      <Route path='/auth/forgot-password' element={<ForgotPassword />} />
      <Route path='/auth/verify-otp' element={<VerifyOtp />} />
      <Route path='/auth/reset-password' element={<ResetPassword />} />
      <Route path='/auth/verify-email' element={<VerifyEmail />} />
      <Route path='*' element={<RedirectToSignIn />} />
    </Routes>
  )
}

const RedirectToSignIn: React.FC = () => {
  const { pathname, search } = useLocation()
  const from = `${pathname}${search}`

  const to = pathname.startsWith('/auth/')
    ? '/auth/signin'
    : `/auth/signin?redirectTo=${encodeURIComponent(from)}`

  return <Navigate to={to} replace />
}
