import { Link } from 'react-router-dom'
import { guestScanLimit } from '@constants/scan'
import { useAuthStore } from '@stores/auth'
import { Button } from '@shared/ui/button'

export const GuestScanLimitNotice: React.FC = () => {
  const isLoggedIn = useAuthStore((state) => !!state.auth.session.userID)

  return (
    <div className='grid gap-3 rounded-lg border border-border bg-card p-5'>
      <h2 className='font-semibold'>
        You've used your {guestScanLimit} free scans
      </h2>
      {isLoggedIn ? (
        <>
          <p className='text-sm text-muted-foreground'>
            Verify your email to scan more pages. Your scans so far move to your
            account.
          </p>
          <div>
            <Button asChild>
              <Link to='/auth/verify-email'>Verify your email</Link>
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className='text-sm text-muted-foreground'>
            Sign in to scan more pages. Your scans so far move to your account.
          </p>
          <div className='flex flex-wrap gap-2'>
            <Button asChild>
              <Link to='/auth/signin?redirectTo=/u/scan'>
                Sign in to scan more
              </Link>
            </Button>
            <Button variant='outline' asChild>
              <Link to='/auth/signup'>Create an account</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
