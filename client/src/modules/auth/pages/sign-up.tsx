import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, UserPlus } from 'lucide-react'
import type { TAuthResponse } from '@typings/auth'
import { authAPI, authKeys } from '@api/auth'
import { useAuthStore } from '@stores/auth'
import { reconcileAnonymousUser } from '@utils/reconcile-anonymous-user'
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
import { Input } from '@shared/ui/input'
import { PasswordInput } from '@shared/ui/password-input'
import { AuthLayout } from '@modules/auth/layout/auth-layout'

const signUpSchema = Yup.object({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters.')
    .required('Please enter your name.'),
  email: Yup.string()
    .email('Enter a valid email address')
    .required('Please enter your email.'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters.')
    .required('Please enter your password.'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], "Passwords don't match.")
    .required('Please confirm your password.'),
})

export const SignUp: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const updateSession = useAuthStore((state) => state.updateSession)
  const { mutate, isPending, error } = useMutation({
    mutationFn: authAPI.signUp,
    onSuccess: (response: TAuthResponse) => {
      updateSession(response.session)
      reconcileAnonymousUser(response.session.userID)
      queryClient.invalidateQueries({ queryKey: authKeys.me() })
      navigate(response.redirectToPath, {
        replace: true,
        state: { verificationSent: true },
      })
    },
  })

  const formik = useFormik({
    initialValues: {
      name: '',
      email: searchParams.get('email') ?? '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: signUpSchema,
    onSubmit: (values) => mutate(values),
  })

  return (
    <AuthLayout>
      <Card className='w-full gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>
            Create an account
          </CardTitle>
          <CardDescription>
            Create your account to get started. Already have one?{' '}
            <Link
              to='/auth/signin'
              className='text-nowrap text-primary underline underline-offset-4 hover:opacity-80'
            >
              Sign in
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
              name='name'
              label='Name'
              error={formik.errors.name}
              touched={formik.touched.name}
            >
              <Input
                id='name'
                name='name'
                autoComplete='name'
                placeholder='Ada Lovelace'
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                aria-invalid={!!(formik.touched.name && formik.errors.name)}
              />
            </FormField>

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
              label='Confirm Password'
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
              {isPending ? <Loader2 className='animate-spin' /> : <UserPlus />}
              Create account
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className='mx-auto px-8 text-center text-sm text-balance text-muted-foreground'>
            Your scans stay private to your account.
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
