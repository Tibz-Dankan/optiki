import { useFormik } from 'formik'
import * as Yup from 'yup'
import { Loader2 } from 'lucide-react'
import { Button } from '@shared/ui/button'
import { Checkbox } from '@shared/ui/checkbox'
import { FormField } from '@shared/ui/form-field'
import { Input } from '@shared/ui/input'
import { Label } from '@shared/ui/label'

const urlScanSchema = Yup.object({
  url: Yup.string()
    .trim()
    .matches(/^https?:\/\/\S+$/i, 'Enter a full address starting with https://')
    .required('Enter the address of a page to scan.'),
})

type UrlScanFormProps = {
  isPending: boolean
  discoverPages?: boolean
  onDiscoverPagesChange?: (checked: boolean) => void
  onScan: (url: string) => void
}

export const UrlScanForm: React.FC<UrlScanFormProps> = ({
  isPending,
  discoverPages = false,
  onDiscoverPagesChange,
  onScan,
}) => {
  const formik = useFormik({
    initialValues: { url: '' },
    validationSchema: urlScanSchema,
    onSubmit: (values) => onScan(values.url.trim()),
  })

  return (
    <form onSubmit={formik.handleSubmit} noValidate>
      <FormField
        name='url'
        label='Page address'
        error={formik.errors.url}
        touched={formik.touched.url}
      >
        <div className='flex gap-2'>
          <Input
            id='url'
            name='url'
            type='url'
            inputMode='url'
            autoComplete='url'
            placeholder='https://example.com/pricing'
            className='h-10 flex-1'
            value={formik.values.url}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            aria-invalid={!!(formik.touched.url && formik.errors.url)}
          />
          <Button
            type='submit'
            size='lg'
            className='shrink-0'
            disabled={isPending}
          >
            Scan
            {isPending && <Loader2 className='animate-spin' />}
          </Button>
        </div>
      </FormField>
      {onDiscoverPagesChange && (
        <div className='mt-3 flex items-center gap-2'>
          <Checkbox
            id='discover-pages'
            checked={discoverPages}
            disabled={isPending}
            onCheckedChange={(checked) =>
              onDiscoverPagesChange(checked === true)
            }
          />
          <Label htmlFor='discover-pages' className='font-normal'>
            Automatically discover other pages of the host and scan them too
          </Label>
        </div>
      )}
    </form>
  )
}
