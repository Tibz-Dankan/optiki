import { Check, Copy, X } from 'lucide-react'
import { cn } from '@utils/classname'
import { getCodeLanguage } from '@utils/get-code-language'
import { useCopyToClipboard } from '@hooks/use-copy-to-clipboard'
import { HighlightedCode } from '@shared/ui/highlighted-code'

type RuleExampleProps = {
  variant: 'before' | 'after'
  ruleID: string
  code: string
}

const variants = {
  before: { title: 'Before', icon: X, iconClassName: 'bg-destructive' },
  after: { title: 'After', icon: Check, iconClassName: 'bg-success' },
}

export const RuleExample: React.FC<RuleExampleProps> = ({
  variant,
  ruleID,
  code,
}) => {
  const { copied, copy } = useCopyToClipboard()
  const { title, icon: Icon, iconClassName } = variants[variant]

  return (
    <figure className='flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-muted/40 dark:bg-background'>
      <figcaption className='flex h-11.5 items-center gap-2 border-b border-border bg-card ps-3.5 pe-2'>
        <span
          aria-hidden
          className={cn(
            'inline-flex size-4.5 shrink-0 items-center justify-center rounded-full text-background',
            iconClassName
          )}
        >
          <Icon className='size-2.75' strokeWidth={3.5} />
        </span>
        <span className='text-sm font-semibold'>{title}</span>
        <span className='truncate text-[13px] text-muted-foreground'>
          {variant === 'before' ? `fails ${ruleID}` : 'passes'}
        </span>
        <button
          type='button'
          onClick={() => copy(code)}
          className='ms-auto inline-flex h-7.5 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium text-muted-foreground transition-colors outline-none hover:bg-muted/60 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50'
        >
          {copied ? (
            <Check className='size-3.5 text-success' aria-hidden />
          ) : (
            <Copy className='size-3.5' aria-hidden />
          )}
          {copied ? 'Copied' : 'Copy'}
          <span className='sr-only'> the {variant} example</span>
        </button>
      </figcaption>
      <HighlightedCode
        code={code}
        language={getCodeLanguage(code)}
        showLineNumbers
        className='flex-1'
      />
      <p role='status' className='sr-only'>
        {copied ? `Copied the ${variant} example` : ''}
      </p>
    </figure>
  )
}
