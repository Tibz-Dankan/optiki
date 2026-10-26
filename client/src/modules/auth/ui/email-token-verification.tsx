import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CircleCheck, CircleX, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { TVerifyEmailResponse } from '@typings/auth'
import { appearanceKeys } from '@api/appearance'
import { authAPI, authKeys } from '@api/auth'
import { useAuthStore } from '@stores/auth'
import { reconcileAnonymousUser } from '@utils/reconcile-anonymous-user'
import { Button } from '@shared/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@shared/ui/card'

type EmailTokenVerificationProps = {
  token: string
}

type TVerificationResult =
  | { status: 'success'; data: TVerifyEmailResponse }
  | { status: 'error'; error: Error }

export const EmailTokenVerification: React.FC<EmailTokenVerificationProps> = ({
  token,
}) => {
  const queryClient = useQueryClient()
  const userID = useAuthStore((state) => state.auth.session.userID)
  const isLoggedIn = !!userID

  const [result, setResult] = useState<TVerificationResult | null>(null)

  const { mutate } = useMutation({
    mutationFn: authAPI.verifyEmail,
    onSuccess: (response) => {
      setResult({ status: 'success', data: response })
      toast.success(response.message)
      if (!isLoggedIn) return
      reconcileAnonymousUser(userID, queryClient)
      queryClient.invalidateQueries({ queryKey: authKeys.me() })
      queryClient.invalidateQueries({ queryKey: appearanceKeys.me() })
    },
    onError: (error) => {
      setResult({ status: 'error', error })
      toast.error(error.message)
    },
  })

  // Single-use token, and StrictMode detaches the observer: outcome lives in state.
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true
    mutate({ token })
  }, [mutate, token])

  if (result?.status === 'success') {
    const alreadyVerified = !!result.data.alreadyVerified

    return (
      <Card className='w-full gap-4'>
        <CardHeader className='items-center text-center'>
          <CircleCheck className='mx-auto size-10 text-success' />
          <CardTitle className='text-lg tracking-tight'>
            {alreadyVerified ? 'Email already verified' : 'Email verified'}
          </CardTitle>
          <CardDescription>
            {alreadyVerified
              ? 'Your email address has already been verified. No further action is needed.'
              : "Your email address has been verified. You're all set."}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild className='w-full'>
            <Link to={isLoggedIn ? '/u/scan' : '/auth/signin'} replace>
              {isLoggedIn ? 'Start scanning' : 'Sign in'}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (result?.status === 'error') {
    return (
      <Card className='w-full gap-4'>
        <CardHeader className='items-center text-center'>
          <CircleX className='mx-auto size-10 text-destructive' />
          <CardTitle className='text-lg tracking-tight'>
            Verification failed
          </CardTitle>
          <CardDescription>{result.error.message}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild className='w-full'>
            <Link
              to={isLoggedIn ? '/auth/verify-email' : '/auth/signin'}
              replace
            >
              {isLoggedIn
                ? 'Request a new link'
                : 'Sign in to request a new link'}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div
      role='status'
      className='flex flex-col items-center gap-3 py-6 text-muted-foreground'
    >
      <Loader2 className='size-6 animate-spin' />
      <p className='text-sm'>Verifying your email…</p>
    </div>
  )
}
