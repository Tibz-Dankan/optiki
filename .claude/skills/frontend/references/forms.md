# Forms — Formik + Yup

Formik with the `useFormik` object API, validated by Yup. **react-hook-form and zod are not used**, and shadcn's react-hook-form-based `ui/form` is deliberately not installed — `@shared/ui/form-field` plays its part.

## The field wrapper

`name` must match the input's `id` and the Formik field name. `error` / `touched` are Formik's `errors[name]` / `touched[name]` — the message shows only once touched. `action` is an optional control rendered opposite the label, e.g. a "Forgot password?" link.

```tsx
// src/modules/shared/ui/form-field.tsx
type FormFieldProps = {
  name: string
  label: React.ReactNode
  error?: string
  touched?: boolean
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  error,
  touched,
  action,
  className,
  children,
}) => {
  const showError = Boolean(touched && error)

  return (
    <div className={cn('grid gap-2', className)}>
      <div className='flex items-center justify-between'>
        <Label htmlFor={name}>{label}</Label>
        {action}
      </div>
      {children}
      {showError && (
        <p id={`${name}-error`} className='text-sm text-destructive'>
          {error}
        </p>
      )}
    </div>
  )
}
```

## Reference implementation

`src/modules/auth/pages/sign-in.tsx`, condensed:

```tsx
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
  const updateSession = useAuthStore((state) => state.updateSession)

  const { mutate, isPending, error } = useMutation({
    mutationFn: authAPI.signIn,
    onSuccess: (response: TAuthResponse) => {
      updateSession(response.session)
      navigate(redirectTo, { replace: true })
    },
  })

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: signInSchema,
    onSubmit: (values) => mutate(values),
  })

  return (
    <form onSubmit={formik.handleSubmit} className='grid gap-3' noValidate>
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
        action={<Link to='/auth/forgot-password'>Forgot password?</Link>}
      >
        <PasswordInput
          id='password'
          name='password'
          autoComplete='current-password'
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          aria-invalid={!!(formik.touched.password && formik.errors.password)}
        />
      </FormField>

      {error && (
        <p role='alert' className='text-sm text-destructive'>
          {error.message}
        </p>
      )}

      <Button type='submit' className='mt-2' disabled={isPending}>
        Sign in
        {isPending ? <Loader2 className='animate-spin' /> : <ArrowRight />}
      </Button>
    </form>
  )
}
```

## Rules

- **Schema** is a module-level `Yup.object({ … })` declared above the component. Every rule carries a sentence-case, punctuated message. Never infer the TS type from the schema — DTOs are hand-written in `src/types/`.
- **`useFormik` object API only** — never the `<Formik>` / `<Field>` / `<ErrorMessage>` components. Default validate-on-change and on-blur; `enableReinitialize` is not used anywhere.
- `onSubmit: (values) => mutate(values)` — shape `initialValues` so it matches the mutation's input type exactly. Strip form-only fields at the call site: `onSubmit: (values) => mutate({ otp, password: values.password })`.
- **`<form noValidate>`** always, so Yup owns validation.
- `id === name === schema key` for every control.
- Controlled quartet on every native input: `value`, `onChange={formik.handleChange}`, `onBlur={formik.handleBlur}`, `aria-invalid={!!(formik.touched.x && formik.errors.x)}`.
- Non-native controls use `formik.setFieldValue`:
  ```tsx
  onValueChange={(theme) => formik.setFieldValue('theme', theme)}
  onChange={(otp) => formik.setFieldValue('otp', otp)}
  ```
  Controls that `FormField` doesn't wrap render their error inline by hand.
- **Server errors come from the mutation, not Formik** — `{error && <p role='alert' className='text-sm text-destructive'>{error.message}</p>}`. `formik.setErrors` and `formik.setStatus` are never used. The message is already normalized by `HttpError`.
- Submit button is `disabled={isPending}` with the `<Loader2 className='animate-spin' />` swap. Add extra gating where it helps: `disabled={formik.values.otp.length < OTP_LENGTH || isPending}`.
- Cross-field rules use Yup refs:
  ```ts
  confirmPassword: Yup.string().oneOf([Yup.ref('password')], "Passwords don't match.")
  ```
- Form-only fields (`confirmPassword`) live in `initialValues` and are typed optional on the DTO (`confirmPassword?: string`).
- Success feedback is a sonner toast: `toast.success('Password updated. Please sign in.')`.
- **Large text inputs** (pasted HTML for a scan) are plain controlled `<textarea>`s in Formik with a Yup `max` that mirrors the server's byte limit. Provide example-loader buttons beside them — automated testers must never have to type kilobytes of HTML.
