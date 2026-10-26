import { Link } from 'react-router-dom'
import { Info } from 'lucide-react'
import { useAuthStore } from '@stores/auth'

export const GuestHistoryBanner: React.FC = () => {
  const isLoggedIn = useAuthStore((state) => !!state.auth.session.userID)
  const isVerified = useAuthStore(
    (state) => !!state.auth.session.userID && state.auth.user.emailVerified
  )

  if (isVerified) return null

  return (
    <p className='flex items-start gap-2 rounded-md border border-border bg-muted p-3 text-sm'>
      <Info className='mt-0.5 size-4 shrink-0' aria-hidden />
      <span>
        Your scans are saved in this browser only.{' '}
        {isLoggedIn ? (
          <Link
            to='/auth/verify-email'
            className='font-medium underline underline-offset-4'
          >
            Verify your email to keep your scan history
          </Link>
        ) : (
          <Link
            to='/auth/signin?redirectTo=/u/scans'
            className='font-medium underline underline-offset-4'
          >
            Sign in to keep your scan history
          </Link>
        )}{' '}
        in your account.
      </span>
    </p>
  )
}
