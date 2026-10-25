import { useFormik } from 'formik'
import * as Yup from 'yup'
import { Loader2 } from 'lucide-react'
import { Button } from '@shared/ui/button'
import { FormField } from '@shared/ui/form-field'
import { Input } from '@shared/ui/input'

const urlScanSchema = Yup.object({
  url: Yup.string()
    .trim()
    .matches(/^https?:\/\/\S+$/i, 'Enter a full address starting with https://')
    .required('Enter the address of a page to scan.'),
})

type UrlScanFormProps = {
  isPending: boolean
  canRender: boolean
  onScan: (url: string) => void
}

export const UrlScanForm: React.FC<UrlScanFormProps> = ({
  isPending,
  canRender,
  onScan,
}) => {
  const formik = useFormik({
    initialValues: { url: '' },
    validationSchema: urlScanSchema,
    onSubmit: (values) => onScan(values.url.trim()),
  })

  return (
    <form onSubmit={formik.handleSubmit} className='grid gap-3' noValidate>
      <FormField
        name='url'
        label='Page address'
        error={formik.errors.url}
        touched={formik.touched.url}
      >
        <Input
          id='url'
          name='url'
          type='url'
          inputMode='url'
          autoComplete='url'
          placeholder='https://example.com/pricing'
          value={formik.values.url}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          aria-invalid={!!(formik.touched.url && formik.errors.url)}
        />
      </FormField>
      <p className='text-sm text-muted-foreground'>
        {canRender
          ? 'The page is loaded in a real browser, so all 17 rules run and a screenshot is saved.'
          : 'Signed out, the page is fetched and scanned statically with the 9 core rules.'}
      </p>
      <div>
        <Button type='submit' disabled={isPending}>
          Scan URL
          {isPending && <Loader2 className='animate-spin' />}
        </Button>
      </div>
    </form>
  )
}
