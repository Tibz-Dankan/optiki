import { Link, useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, Loader2 } from 'lucide-react'
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
import { FormField } from '@shared/ui/form-field'
import { Input } from '@shared/ui/input'
import { AuthLayout } from '@modules/auth/layout/auth-layout'

const forgotPasswordSchema = Yup.object({
  email: Yup.string()
    .email('Enter a valid email address')
    .required('Please enter your email.'),
})

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate()

  const { mutate, isPending, error } = useMutation({
    mutationFn: authAPI.forgotPassword,
    onSuccess: (_data, variables) => {
      toast.success(
        `If an account exists for ${variables.email}, a code has been sent.`
      )
      navigate(
        `/auth/verify-otp?email=${encodeURIComponent(variables.email)}`,
        {
          replace: true,
        }
      )
    },
  })

  const formik = useFormik({
    initialValues: { email: '' },
    validationSchema: forgotPasswordSchema,
    onSubmit: (values) => mutate({ email: values.email.trim() }),
  })

  return (
    <AuthLayout>
      <Card className='w-full gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>
            Forgot Password
          </CardTitle>
          <CardDescription>
            Enter your registered email and we will send you a code to reset
            your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={formik.handleSubmit}
            className='grid gap-2'
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

            {error && (
              <p role='alert' className='text-sm text-destructive'>
                {error.message}
              </p>
            )}

            <Button type='submit' className='mt-2' disabled={isPending}>
              Continue
              {isPending ? (
                <Loader2 className='animate-spin' />
              ) : (
                <ArrowRight />
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className='mx-auto px-8 text-center text-sm text-balance text-muted-foreground'>
            Don't have an account?{' '}
            <Link
              to='/auth/signup'
              className='text-primary underline underline-offset-4 hover:opacity-80'
            >
              Sign up
            </Link>
            .
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
