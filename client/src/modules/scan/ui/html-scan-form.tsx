import { useFormik } from 'formik'
import * as Yup from 'yup'
import { Loader2 } from 'lucide-react'
import { Button } from '@shared/ui/button'
import { FormField } from '@shared/ui/form-field'
import { Textarea } from '@shared/ui/textarea'

const maxHTMLBytes = 2 * 1024 * 1024

const htmlScanSchema = Yup.object({
  html: Yup.string()
    .trim()
    .required('Paste the HTML of a page to scan.')
    .test(
      'size',
      'The HTML must be under 2 MB.',
      (value) => new Blob([value ?? '']).size <= maxHTMLBytes
    ),
})

type HtmlScanFormProps = {
  isPending: boolean
  onScan: (html: string) => void
}

export const HtmlScanForm: React.FC<HtmlScanFormProps> = ({
  isPending,
  onScan,
}) => {
  const formik = useFormik({
    initialValues: { html: '' },
    validationSchema: htmlScanSchema,
    onSubmit: (values) => onScan(values.html),
  })

  return (
    <form onSubmit={formik.handleSubmit} className='grid gap-3' noValidate>
      <FormField
        name='html'
        label='Page HTML'
        error={formik.errors.html}
        touched={formik.touched.html}
      >
        <Textarea
          id='html'
          name='html'
          rows={10}
          spellCheck={false}
          className='font-mono text-xs'
          value={formik.values.html}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          aria-invalid={!!(formik.touched.html && formik.errors.html)}
        />
      </FormField>
      <p className='text-sm text-muted-foreground'>
        Pasted HTML is scanned statically and never stored; only the findings
        are.
      </p>
      <div>
        <Button type='submit' disabled={isPending}>
          Scan HTML
          {isPending && <Loader2 className='animate-spin' />}
        </Button>
      </div>
    </form>
  )
}
