import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Loader2 } from 'lucide-react'
import type { TAuthResponse } from '@typings/auth'
import { authAPI, authKeys } from '@api/auth'
import { useAuthStore } from '@stores/auth'
import { getRedirectPath } from '@utils/get-redirect-path'
import { reconcileAnonymousUser } from '@utils/reconcile-anonymous-user'
import { Button } from '@shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/ui/card'
import { FormField } from '@shared/ui/form-field'
import { Input } from '@shared/ui/input'
import { PasswordInput } from '@shared/ui/password-input'
import { AuthLayout } from '@modules/auth/layout/auth-layout'

const signInSchema = Yup.object({
  email: Yup.string()
    .email('Enter a valid email address')
    .required('Please enter your email.'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters.')
    .required('Please enter your password.'),
})

export const SignIn: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const updateSession = useAuthStore((state) => state.updateSession)
  const requestedPath = searchParams.get('redirectTo')

  const { mutate, isPending, error } = useMutation({
    mutationFn: authAPI.signIn,
    onSuccess: (response: TAuthResponse) => {
      updateSession(response.session)
      reconcileAnonymousUser(response.session.userID)
      queryClient.invalidateQueries({ queryKey: authKeys.me() })
      navigate(getRedirectPath(response.redirectToPath, requestedPath), {
        replace: true,
      })
    },
  })

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: signInSchema,
    onSubmit: (values) => mutate(values),
  })

  return (
    <AuthLayout>
      <Card className='w-full gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>Sign in</CardTitle>
          <CardDescription>
            Sign in to your account. Don't have an account?{' '}
            <Link
              to='/auth/signup'
              className='text-nowrap text-primary underline underline-offset-4 hover:opacity-80'
            >
              Sign up
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-3'>
          <form
            onSubmit={formik.handleSubmit}
            className='grid gap-3'
            noValidate
          >
            <FormField
              name='email'
              label='Email'
              error={formik.errors.email}
              touched={formik.touched.email}
            >
              <Input
                id='email'
                name='email'
                type='email'
                autoComplete='email'
                placeholder='name@example.com'
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-invalid={!!(formik.touched.email && formik.errors.email)}
              />
            </FormField>

            <FormField
              name='password'
              label='Password'
              error={formik.errors.password}
              touched={formik.touched.password}
              action={
                <Link
                  to='/auth/forgot-password'
                  className='text-sm font-medium text-primary underline underline-offset-4 hover:opacity-80'
                >
                  Forgot password?
                </Link>
              }
            >
              <PasswordInput
                id='password'
                name='password'
                autoComplete='current-password'
                placeholder='********'
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-invalid={
                  !!(formik.touched.password && formik.errors.password)
                }
              />
            </FormField>

            {error && (
              <p role='alert' className='text-sm text-destructive'>
                {error.message}
              </p>
            )}

            <Button type='submit' className='mt-2' disabled={isPending}>
              Sign in
              {isPending ? (
                <Loader2 className='animate-spin' />
              ) : (
                <ArrowRight />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
