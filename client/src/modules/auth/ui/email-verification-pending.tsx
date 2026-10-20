import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Loader2, MailCheck } from 'lucide-react'
import { toast } from 'sonner'
import { authAPI } from '@api/auth'
import { useAuthStore } from '@stores/auth'
import { Button } from '@shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@shared/ui/card'
import { SignOutDialog } from '@shared/ui/sign-out-dialog'
import { ChangeEmailDialog } from '@modules/auth/ui/change-email-dialog'

const RESEND_COOLDOWN_SECONDS = 60

type TVerifyEmailLocationState = {
  verificationSent?: boolean
} | null

export const EmailVerificationPending: React.FC = () => {
  const location = useLocation()
  const email = useAuthStore((state) => state.auth.user.email)
  const initiallySent = !!(location.state as TVerifyEmailLocationState)
    ?.verificationSent

  const [hasSent, setHasSent] = useState(initiallySent)
  const [secondsLeft, setSecondsLeft] = useState(
    initiallySent ? RESEND_COOLDOWN_SECONDS : 0
  )
  const [isChangeEmailOpen, setIsChangeEmailOpen] = useState(false)
  const [isSignOutOpen, setIsSignOutOpen] = useState(false)

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timeout = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(timeout)
  }, [secondsLeft])

  const startCooldown = () => {
    setHasSent(true)
    setSecondsLeft(RESEND_COOLDOWN_SECONDS)
  }

  const { mutate, isPending } = useMutation({
    mutationFn: authAPI.initiateEmailVerification,
    onSuccess: (response) => {
      toast.success(response.message)
      startCooldown()
    },
  })

  const sendLabel = hasSent ? 'Resend link' : 'Send verification link'

  return (
    <Card className='w-full gap-4'>
      <CardHeader>
        <CardTitle className='text-lg tracking-tight'>
          Verify your email
        </CardTitle>
        <CardDescription>
          {hasSent ? (
            <>
              We've sent a verification link to{' '}
              <span className='font-medium text-foreground'>{email}</span>.
              Check your inbox and click the link to continue.
            </>
          ) : (
            <>
              Your email{' '}
              <span className='font-medium text-foreground'>{email}</span> isn't
              verified yet. Send yourself a verification link to continue.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className='grid gap-3'>
        {hasSent && (
          <p className='text-sm text-muted-foreground'>
            Didn't receive it? Check your spam folder or send a new link.
          </p>
        )}
        <Button
          type='button'
          disabled={isPending || secondsLeft > 0}
          onClick={() => mutate()}
        >
          {isPending ? <Loader2 className='animate-spin' /> : <MailCheck />}
          {secondsLeft > 0 ? `${sendLabel} in ${secondsLeft}s` : sendLabel}
        </Button>
      </CardContent>
      <CardFooter className='flex-col gap-2'>
        <p className='text-center text-sm text-muted-foreground'>
          Wrong email?{' '}
          <button
            type='button'
            className='text-primary underline underline-offset-4 hover:opacity-80'
            onClick={() => setIsChangeEmailOpen(true)}
          >
            Change email
          </button>
        </p>
        <p className='text-center text-sm text-muted-foreground'>
          <button
            type='button'
            className='text-primary underline underline-offset-4 hover:opacity-80'
            onClick={() => setIsSignOutOpen(true)}
          >
            Sign out
          </button>
        </p>
      </CardFooter>

      <ChangeEmailDialog
        open={isChangeEmailOpen}
        onOpenChange={setIsChangeEmailOpen}
        onEmailChanged={startCooldown}
      />
      <SignOutDialog open={isSignOutOpen} onOpenChange={setIsSignOutOpen} />
    </Card>
  )
}
