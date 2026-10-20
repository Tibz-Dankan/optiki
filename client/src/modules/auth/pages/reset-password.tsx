import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { TAuthResponse } from '@typings/auth'
import { authAPI, authKeys } from '@api/auth'
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
import { FormField } from '@shared/ui/form-field'
import { PasswordInput } from '@shared/ui/password-input'
import { AuthLayout } from '@modules/auth/layout/auth-layout'

const resetPasswordSchema = Yup.object({
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters.')
    .required('Please enter your new password.'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], "Passwords don't match.")
    .required('Please confirm your new password.'),
})

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const updateSession = useAuthStore((state) => state.updateSession)
  const otp = searchParams.get('otp') ?? ''
  const email = searchParams.get('email') ?? ''

  const { mutate, isPending, error } = useMutation({
    mutationFn: authAPI.resetPassword,
    onSuccess: (response: TAuthResponse) => {
      updateSession(response.session)
      toast.success('Password updated.')
      queryClient.invalidateQueries({ queryKey: authKeys.me() })
      navigate(response.redirectToPath, { replace: true })
    },
  })

  const formik = useFormik({
    initialValues: { password: '', confirmPassword: '' },
    validationSchema: resetPasswordSchema,
    onSubmit: (values) => mutate({ email, otp, password: values.password }),
  })

  if (!otp || !email) return <Navigate to='/auth/forgot-password' replace />

  return (
    <AuthLayout>
      <Card className='w-full gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>
            Reset Password
          </CardTitle>
          <CardDescription>
            Choose a new password for your account. You will be signed out of
            other devices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={formik.handleSubmit}
            className='grid gap-3'
            noValidate
          >
            <FormField
              name='password'
              label='New password'
              error={formik.errors.password}
              touched={formik.touched.password}
            >
              <PasswordInput
                id='password'
                name='password'
                autoComplete='new-password'
                placeholder='********'
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-invalid={
                  !!(formik.touched.password && formik.errors.password)
                }
              />
            </FormField>

            <FormField
              name='confirmPassword'
              label='Confirm new password'
              error={formik.errors.confirmPassword}
              touched={formik.touched.confirmPassword}
            >
              <PasswordInput
                id='confirmPassword'
                name='confirmPassword'
                autoComplete='new-password'
                placeholder='********'
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-invalid={
                  !!(
                    formik.touched.confirmPassword &&
                    formik.errors.confirmPassword
                  )
                }
              />
            </FormField>

            {error && (
              <p role='alert' className='text-sm text-destructive'>
                {error.message}
              </p>
            )}

            <Button type='submit' className='mt-2' disabled={isPending}>
              {isPending ? <Loader2 className='animate-spin' /> : <KeyRound />}
              Reset password
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className='mx-auto px-8 text-center text-sm text-balance text-muted-foreground'>
            Remembered it?{' '}
            <Link
              to='/auth/signin'
              className='text-primary underline underline-offset-4 hover:opacity-80'
            >
              Sign in
            </Link>
            .
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
