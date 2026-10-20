import { useFormik } from 'formik'
import * as Yup from 'yup'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { TUserResponse } from '@typings/auth'
import { authAPI, authKeys } from '@api/auth'
import { useAuthStore } from '@stores/auth'
import { Button } from '@shared/ui/button'
import { Input } from '@shared/ui/input'
import { SettingsRow } from '@modules/settings/ui/settings-row'

const fullNameSchema = Yup.object({
  name: Yup.string()
    .trim()
    .min(3, 'Name must be at least 3 characters.')
    .required('Please enter your full name.'),
})

export const ProfileSection: React.FC = () => {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.auth.user)

  const { mutate, isPending } = useMutation({
    mutationFn: authAPI.updateUser,
    onSuccess: (response: TUserResponse) => {
      queryClient.invalidateQueries({ queryKey: authKeys.all })
      toast.success(response.message)
    },
  })

  const formik = useFormik({
    initialValues: { name: user.name },
    validationSchema: fullNameSchema,
    onSubmit: (values) =>
      mutate({ userID: user.id, name: values.name }),
  })

  const isUnchanged = formik.values.name.trim() === user.name

  return (
    <section>
      <h3 className='text-sm font-semibold text-muted-foreground'>Profile</h3>


      <SettingsRow label='Full name'>
        <form
          onSubmit={formik.handleSubmit}
          className='flex items-start gap-2'
          noValidate
        >
          <div className='grid gap-2'>
            <Input
              id='name'
              name='name'
              autoComplete='name'
              className='sm:w-64'
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              aria-invalid={!!(formik.touched.name && formik.errors.name)}
            />
            {formik.touched.name && formik.errors.name && (
              <p className='text-sm text-destructive'>{formik.errors.name}</p>
            )}
          </div>
          <Button type='submit' disabled={isPending || isUnchanged}>
            Save
            {isPending && <Loader2 className='animate-spin' />}
          </Button>
        </form>
      </SettingsRow>
    </section>
  )
}
