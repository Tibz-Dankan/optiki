import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@stores/auth'
import { AuthLayout } from '@modules/auth/layout/auth-layout'
import { EmailTokenVerification } from '@modules/auth/ui/email-token-verification'
import { EmailVerificationPending } from '@modules/auth/ui/email-verification-pending'

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams()
  const isLoggedIn = useAuthStore((state) => !!state.auth.session.userID)
  const token = searchParams.get('token')

  if (!token && !isLoggedIn) {
    return <Navigate to='/auth/signin' replace />
  }

  return (
    <AuthLayout>
      {token ? (
        <EmailTokenVerification token={token} />
      ) : (
        <EmailVerificationPending />
      )}
    </AuthLayout>
  )
}
