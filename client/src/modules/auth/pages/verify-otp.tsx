import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { authAPI } from '@api/auth'
import { Button } from '@shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@shared/ui/card'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@shared/ui/input-otp'
import { Label } from '@shared/ui/label'
import { AuthLayout } from '@modules/auth/layout/auth-layout'

const OTP_LENGTH = 6

const verifyOtpSchema = Yup.object({
  otp: Yup.string()
    .length(OTP_LENGTH, `Please enter the ${OTP_LENGTH}-digit code.`)
    .required(`Please enter the ${OTP_LENGTH}-digit code.`),
})

export const VerifyOtp: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') ?? ''

  const { mutate, isPending, error } = useMutation({
    mutationFn: authAPI.verifyOTP,
    onSuccess: (_data, variables) => {
      const params = new URLSearchParams({
        email: variables.email,
        otp: variables.otp,
      })
      navigate(`/auth/reset-password?${params.toString()}`, { replace: true })
    },
  })

  const { mutate: resendCode, isPending: isResending } = useMutation({
    mutationFn: authAPI.forgotPassword,
    onSuccess: () => {
      toast.success(
        `If an account exists for ${email}, a new code has been sent.`
      )
    },
  })

  const formik = useFormik({
    initialValues: { otp: '' },
    validationSchema: verifyOtpSchema,
    onSubmit: (values) => mutate({ email, otp: values.otp }),
  })

  if (!email) return <Navigate to='/auth/forgot-password' replace />

  return (
    <AuthLayout className='max-w-lg'>
      <Card className='w-full gap-4'>
        <CardHeader>
          <CardTitle className='text-base tracking-tight'>Verify OTP</CardTitle>
          <CardDescription>
            Please enter the 6-digit code we sent to{' '}
            <span className='font-medium text-foreground'>{email}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={formik.handleSubmit}
            className='grid gap-2'
            noValidate
          >
            <Label htmlFor='otp' className='sr-only'>
              One-Time Password
            </Label>
            <InputOTP
              id='otp'
              name='otp'
              maxLength={OTP_LENGTH}
              value={formik.values.otp}
              onChange={(otp) => formik.setFieldValue('otp', otp)}
              onBlur={formik.handleBlur}
              containerClassName='w-full'
            >
              <InputOTPGroup className='w-full justify-between'>
                {Array.from({ length: OTP_LENGTH }, (_, index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className='size-10 rounded-md border text-base sm:size-12'
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>

            {formik.touched.otp && formik.errors.otp && (
              <p className='text-sm text-destructive'>{formik.errors.otp}</p>
            )}

            {error && (
              <p role='alert' className='text-sm text-destructive'>
                {error.message}
              </p>
            )}

            <Button
              type='submit'
              className='mt-2'
              disabled={formik.values.otp.length < OTP_LENGTH || isPending}
            >
              {isPending && <Loader2 className='animate-spin' />}
              Verify
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className='mx-auto px-8 text-center text-sm text-balance text-muted-foreground'>
            Haven't received it?{' '}
            <button
              type='button'
              disabled={isResending}
              onClick={() => resendCode({ email })}
              className='text-primary underline underline-offset-4 hover:opacity-80 disabled:opacity-50'
            >
              Resend a new code
            </button>
            .
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
