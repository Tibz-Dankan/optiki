import { useFormik } from 'formik'
import * as Yup from 'yup'
import { CircleAlert, Globe, Loader2, ScanSearch } from 'lucide-react'
import { cn } from '@utils/classname'
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
  pendingMessage: string
  error?: string
  hint?: React.ReactNode
  onScan: (url: string) => void
  children?: React.ReactNode
}

export const UrlScanForm: React.FC<UrlScanFormProps> = ({
  isPending,
  pendingMessage,
  error,
  hint,
  onScan,
  children,
}) => {
  const formik = useFormik({
    initialValues: { url: '' },
    validationSchema: urlScanSchema,
    onSubmit: (values) => onScan(values.url.trim()),
  })
  const isInvalid = !!(formik.touched.url && formik.errors.url)
  const errorMessage = (isInvalid && formik.errors.url) || error
  const describedBy = isPending
    ? 'scan-status'
    : errorMessage
      ? 'url-error url-hint'
      : 'url-hint'

  return (
    <div>
      <form
        onSubmit={formik.handleSubmit}
        noValidate
        className={cn(
          'group relative overflow-hidden rounded-lg border bg-card shadow-[0_24px_48px_-24px_rgb(0_0_0/0.15)] ring-4 transition-[border-color,box-shadow] dark:shadow-[0_24px_48px_-24px_rgb(0_0_0/0.7)]',
          isInvalid
            ? 'border-destructive ring-destructive/14 focus-within:ring-destructive/20'
            : 'border-input ring-transparent focus-within:border-primary focus-within:ring-primary/22'
        )}
      >
        <FormField
          name='url'
          label={
            <span className='text-[13px] text-muted-foreground'>
              Page address
            </span>
          }
          className='ps-5 pe-3 pt-4 pb-3'
        >
          <div className='flex flex-wrap items-center gap-3'>
            <Globe
              className='size-5.5 shrink-0 text-muted-foreground transition-colors group-focus-within:text-primary'
              aria-hidden
            />
            <Input
              id='url'
              name='url'
              type='url'
              inputMode='url'
              autoComplete='url'
              placeholder='https://example.com/pricing'
              className='h-12 min-w-0 flex-[999_1_15rem] border-0 bg-transparent px-0 pe-2 text-xl font-medium tracking-[-0.01em] shadow-none placeholder:text-muted-foreground focus-visible:ring-0 aria-invalid:ring-0 md:text-xl dark:bg-transparent'
              value={formik.values.url}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              aria-invalid={isInvalid}
              aria-describedby={describedBy}
            />
            <Button
              type='submit'
              size='lg'
              className='h-12 flex-[1_0_auto] text-base font-semibold has-[>svg]:px-5.5'
              disabled={isPending}
            >
              {isPending ? (
                <Loader2
                  className='size-4.5 animate-spin'
                  strokeWidth={2.25}
                  aria-hidden
                />
              ) : (
                <ScanSearch
                  className='size-4.5'
                  strokeWidth={2.25}
                  aria-hidden
                />
              )}
              Scan
            </Button>
          </div>
        </FormField>
        {children && (
          <div className='border-t border-border/70 px-5 py-3.5 transition-colors has-data-[state=checked]:bg-primary/6'>
            {children}
          </div>
        )}
        {isPending && (
          <div
            aria-hidden
            className='absolute inset-x-0 bottom-0 h-0.5 overflow-hidden'
          >
            <div className='h-full w-2/5 animate-scan-sweep bg-primary motion-reduce:animate-none' />
          </div>
        )}
      </form>

      {errorMessage && (
        <p
          id='url-error'
          role='alert'
          className='mt-3 flex items-center gap-2 text-sm text-destructive'
        >
          <CircleAlert className='size-4 shrink-0' aria-hidden />
          {errorMessage}
        </p>
      )}

      {isPending ? (
        <p
          id='scan-status'
          role='status'
          className='mt-3.5 text-sm text-muted-foreground'
        >
          {pendingMessage}
        </p>
      ) : (
        <div
          id='url-hint'
          className='mt-3.5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2'
        >
          <div className='flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted-foreground'>
            {hint}
          </div>
          <p className='hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex'>
            Press
            <kbd className='rounded border border-border bg-card px-1.5 py-px font-mono text-[11px] text-foreground'>
              Enter
            </kbd>
            to scan
          </p>
        </div>
      )}
    </div>
  )
}
