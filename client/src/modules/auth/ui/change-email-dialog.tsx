import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { TUserResponse } from '@typings/auth'
import { authAPI, authKeys } from '@api/auth'
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
import { Input } from '@shared/ui/input'

const changeEmailSchema = Yup.object({
  email: Yup.string()
    .trim()
    .email('Enter a valid email address')
    .required('Please enter your new email.'),
})

type ChangeEmailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEmailChanged?: () => void
}

export const ChangeEmailDialog: React.FC<ChangeEmailDialogProps> = ({
  open,
  onOpenChange,
  onEmailChanged,
}) => {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.auth.user)
  const updateUser = useAuthStore((state) => state.updateUser)

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: authAPI.changeEmail,
    onSuccess: (response: TUserResponse) => {
      updateUser({ ...user, email: response.data.email })
      queryClient.invalidateQueries({ queryKey: authKeys.me() })
      toast.success(`Verification link sent to ${response.data.email}`)
      onEmailChanged?.()
      formik.resetForm()
      onOpenChange(false)
    },
  })

  const formik = useFormik({
    initialValues: { email: '' },
    validationSchema: changeEmailSchema,
    onSubmit: (values) => mutate({ email: values.email.trim() }),
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
          <DialogTitle>Change email</DialogTitle>
          <DialogDescription>
            We will send a new verification link to this address.
          </DialogDescription>
        </DialogHeader>

        <form
          id='change-email-form'
          onSubmit={formik.handleSubmit}
          className='grid gap-3'
          noValidate
        >
          <FormField
            name='email'
            label='New email'
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
          <Button type='submit' form='change-email-form' disabled={isPending}>
            Change email
            {isPending && <Loader2 className='animate-spin' />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
