import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiTokenMaxNameLength } from '@constants/api-token'
import type { TAPIToken, TAPITokenPermission } from '@typings/api-token'
import { apiTokenAPI, apiTokenKeys } from '@api/api-token'
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
import { PermissionCheckboxes } from '@modules/api-token/ui/permission-checkboxes'

const editAPITokenSchema = Yup.object({
  name: Yup.string()
    .trim()
    .max(apiTokenMaxNameLength, 'Use at most 64 characters.')
    .required('The token needs a name.'),
  permissions: Yup.array().min(1, 'Select at least one permission.'),
})

type EditAPITokenDialogProps = {
  token: TAPIToken | null
  onOpenChange: (open: boolean) => void
}

export const EditAPITokenDialog: React.FC<EditAPITokenDialogProps> = ({
  token,
  onOpenChange,
}) => {
  const queryClient = useQueryClient()

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: apiTokenAPI.update,
    onSuccess: () => {
      toast.success('API token updated')
      queryClient.invalidateQueries({ queryKey: apiTokenKeys.all })
      onOpenChange(false)
    },
    onError: () => {},
  })

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: token?.name ?? '',
      permissions: (token?.permissions ?? []) as TAPITokenPermission[],
    },
    validationSchema: editAPITokenSchema,
    onSubmit: (values) => {
      if (!token) return
      mutate({
        id: token.id,
        name: values.name.trim(),
        permissions: values.permissions,
      })
    },
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={!!token} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Edit API token</DialogTitle>
          <DialogDescription>
            Rename the token or change what it may do. Its expiry can't change;
            create a new token for that.
          </DialogDescription>
        </DialogHeader>

        <form
          id='edit-api-token-form'
          onSubmit={formik.handleSubmit}
          className='grid gap-4'
          noValidate
        >
          <FormField
            name='edit-token-name'
            label='Token name'
            error={formik.errors.name}
            touched={formik.touched.name}
          >
            <Input
              id='edit-token-name'
              name='name'
              autoComplete='off'
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              aria-invalid={!!(formik.touched.name && formik.errors.name)}
            />
          </FormField>
          <PermissionCheckboxes
            value={formik.values.permissions}
            error={formik.errors.permissions as string | undefined}
            onChange={(permissions) =>
              formik.setFieldValue('permissions', permissions)
            }
          />
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
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type='submit' form='edit-api-token-form' disabled={isPending}>
            Save token
            {isPending && <Loader2 className='animate-spin' />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
