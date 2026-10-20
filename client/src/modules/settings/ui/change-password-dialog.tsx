import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { authAPI } from '@api/auth'
import { useAuthStore } from '@stores/auth'
import { Button } from '@shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/ui/dialog'
import { FormField } from '@shared/ui/form-field'
import { PasswordInput } from '@shared/ui/password-input'

const changePasswordSchema = Yup.object({
  currentPassword: Yup.string().required('Please enter your current password.'),
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters.')
    .notOneOf(
      [Yup.ref('currentPassword')],
      'New password must differ from the current one.'
    )
    .required('Please enter a new password.'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], "Passwords don't match.")
    .required('Please confirm your new password.'),
})

type ChangePasswordDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const userID = useAuthStore((state) => state.auth.user.id)

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: authAPI.changePassword,
    onSuccess: () => {
      toast.success('Password changed successfully!')
      formik.resetForm()
      onOpenChange(false)
    },
  })

  const formik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: changePasswordSchema,
    onSubmit: (values) =>
      mutate({
        userID,
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }),
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      formik.resetForm()
      reset()
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>
            Enter your current password, then choose a new one.
          </DialogDescription>
        </DialogHeader>

        <form
          id='change-password-form'
          onSubmit={formik.handleSubmit}
          className='grid gap-3'
          noValidate
        >
          <FormField
            name='currentPassword'
            label='Current password'
            error={formik.errors.currentPassword}
            touched={formik.touched.currentPassword}
          >
            <PasswordInput
              id='currentPassword'
              name='currentPassword'
              autoComplete='current-password'
              value={formik.values.currentPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              aria-invalid={
                !!(
                  formik.touched.currentPassword &&
                  formik.errors.currentPassword
                )
              }
            />
          </FormField>

          <FormField
            name='newPassword'
            label='New password'
            error={formik.errors.newPassword}
            touched={formik.touched.newPassword}
          >
            <PasswordInput
              id='newPassword'
              name='newPassword'
              autoComplete='new-password'
              value={formik.values.newPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              aria-invalid={
                !!(formik.touched.newPassword && formik.errors.newPassword)
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
        </form>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            disabled={isPending}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type='submit'
            form='change-password-form'
            disabled={isPending}
          >
            Change password
            {isPending && <Loader2 className='animate-spin' />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
