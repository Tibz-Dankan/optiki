import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import {
  apiTokenExpiryOptions,
  apiTokenMaxNameLength,
  defaultAPITokenPermissions,
} from '@constants/api-token'
import type {
  TAPITokenExpiry,
  TAPITokenPermission,
  TCreateAPITokenResponse,
  TCreatedAPIToken,
} from '@typings/api-token'
import { apiTokenAPI, apiTokenKeys } from '@api/api-token'
import { getAPITokenExpiresAt } from '@utils/get-api-token-expires-at'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select'
import { PermissionCheckboxes } from '@modules/api-token/ui/permission-checkboxes'

const createAPITokenSchema = Yup.object({
  name: Yup.string()
    .trim()
    .max(apiTokenMaxNameLength, 'Use at most 64 characters.')
    .required('Give the token a name, such as "GitHub Action".'),
  permissions: Yup.array().min(1, 'Select at least one permission.'),
})

type CreateAPITokenDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (token: TCreatedAPIToken) => void
}

export const CreateAPITokenDialog: React.FC<CreateAPITokenDialogProps> = ({
  open,
  onOpenChange,
  onCreated,
}) => {
  const queryClient = useQueryClient()

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: apiTokenAPI.create,
    onSuccess: (response: TCreateAPITokenResponse) => {
      queryClient.invalidateQueries({ queryKey: apiTokenKeys.all })
      formik.resetForm()
      onOpenChange(false)
      onCreated(response.data)
    },
    onError: () => {},
  })

  const formik = useFormik({
    initialValues: {
      name: '',
      permissions: defaultAPITokenPermissions as TAPITokenPermission[],
      expiry: '30d' as TAPITokenExpiry,
    },
    validationSchema: createAPITokenSchema,
    onSubmit: (values) =>
      mutate({
        name: values.name.trim(),
        permissions: values.permissions,
        expiresAt: getAPITokenExpiresAt(values.expiry),
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
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Create API token</DialogTitle>
          <DialogDescription>
            Tokens let scripts and CI scan pages as you, with only the
            permissions you pick.
          </DialogDescription>
        </DialogHeader>

        <form
          id='create-api-token-form'
          onSubmit={formik.handleSubmit}
          className='grid gap-4'
          noValidate
        >
          <FormField
            name='name'
            label='Token name'
            error={formik.errors.name}
            touched={formik.touched.name}
          >
            <Input
              id='name'
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
            error={
              formik.submitCount > 0
                ? (formik.errors.permissions as string | undefined)
                : undefined
            }
            onChange={(permissions) =>
              formik.setFieldValue('permissions', permissions)
            }
          />

          <FormField name='expiry' label='Expires'>
            <Select
              value={formik.values.expiry}
              onValueChange={(value) => formik.setFieldValue('expiry', value)}
            >
              <SelectTrigger id='expiry' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {apiTokenExpiryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          {formik.values.expiry === 'none' && (
            <p className='text-sm text-muted-foreground'>
              A token that never expires stays valid until you revoke it.
            </p>
          )}

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
          <Button
            type='submit'
            form='create-api-token-form'
            disabled={isPending}
          >
            Create token
            {isPending && <Loader2 className='animate-spin' />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
