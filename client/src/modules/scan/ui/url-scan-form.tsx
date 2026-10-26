import { useFormik } from 'formik'
import * as Yup from 'yup'
import { Globe, Loader2, ScanSearch } from 'lucide-react'
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
  onScan: (url: string) => void
  children?: React.ReactNode
}

export const UrlScanForm: React.FC<UrlScanFormProps> = ({
  isPending,
  onScan,
  children,
}) => {
  const formik = useFormik({
    initialValues: { url: '' },
    validationSchema: urlScanSchema,
    onSubmit: (values) => onScan(values.url.trim()),
  })
  const isInvalid = !!(formik.touched.url && formik.errors.url)

  return (
    <form
      onSubmit={formik.handleSubmit}
      noValidate
      className='overflow-hidden rounded-xl border border-primary/40 bg-card shadow-lg shadow-primary/5 transition-shadow focus-within:border-primary focus-within:ring-[3px] focus-within:ring-ring/30'
    >
      <FormField
        name='url'
        label={
          <span className='font-normal text-muted-foreground'>
            Page address
          </span>
        }
        error={formik.errors.url}
        touched={formik.touched.url}
        className='p-4 sm:p-5'
      >
        <div className='flex items-center gap-3'>
          <Globe className='size-5 shrink-0 text-primary' aria-hidden />
          <Input
            id='url'
            name='url'
            type='url'
            inputMode='url'
            autoComplete='url'
            placeholder='https://example.com/pricing'
            className='h-11 flex-1 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0 aria-invalid:ring-0 sm:text-lg md:text-lg dark:bg-transparent'
            value={formik.values.url}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            aria-invalid={isInvalid}
            aria-describedby={isInvalid ? 'url-error' : undefined}
          />
          <Button
            type='submit'
            size='lg'
            className='h-11 shrink-0 text-base has-[>svg]:px-5'
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className='animate-spin' aria-hidden />
            ) : (
              <ScanSearch aria-hidden />
            )}
            Scan
          </Button>
        </div>
      </FormField>
      {children && (
        <div className='border-t border-border px-4 py-3 sm:px-5'>
          {children}
        </div>
      )}
    </form>
  )
}
