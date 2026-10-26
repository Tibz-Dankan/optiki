import { isValidElement } from 'react'
import { Square, SquareCheck } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { THighlightLanguage } from '@typings/code'
import { cn } from '@utils/classname'
import { HighlightedCode } from '@shared/ui/highlighted-code'

type FixReportMarkdownProps = {
  content: string
}

const highlightLanguages: THighlightLanguage[] = ['html', 'css']

const isHighlightLanguage = (
  language: string
): language is THighlightLanguage =>
  highlightLanguages.includes(language as THighlightLanguage)

// The report sits under the page's h1 and the section's h2, so its headings start at h3.
const components: Components = {
  h1: ({ children }) => (
    <h3 className='mt-2 text-xl font-bold tracking-tight'>{children}</h3>
  ),
  h2: ({ children }) => (
    <h4 className='mt-6 border-b border-border pb-1 text-lg font-semibold'>
      {children}
    </h4>
  ),
  h3: ({ children }) => (
    <h5 className='mt-5 text-base font-semibold'>{children}</h5>
  ),
  h4: ({ children }) => (
    <h6 className='mt-4 text-sm font-semibold'>{children}</h6>
  ),
  h5: ({ children }) => (
    <h6 className='mt-4 text-sm font-semibold'>{children}</h6>
  ),
  h6: ({ children }) => (
    <h6 className='mt-4 text-sm font-semibold'>{children}</h6>
  ),
  p: ({ children }) => <p className='my-3'>{children}</p>,
  ul: ({ children, className }) => (
    <ul
      className={cn(
        'my-3 space-y-1',
        className?.includes('contains-task-list')
          ? 'list-none ps-0'
          : 'list-disc ps-5'
      )}
    >
      {children}
    </ul>
  ),
  ol: ({ children, start }) => (
    <ol start={start} className='my-3 list-decimal space-y-1 ps-5'>
      {children}
    </ol>
  ),
  li: ({ children, className }) => (
    <li className={cn(className?.includes('task-list-item') && 'list-none')}>
      {children}
    </li>
  ),
  input: ({ checked }) => {
    const Icon = checked ? SquareCheck : Square
    return (
      <Icon
        aria-hidden
        className='me-2 inline size-4 -translate-y-px align-middle text-muted-foreground'
      />
    )
  },
  a: ({ children, href }) =>
    href ? (
      <a
        href={href}
        target='_blank'
        rel='noopener noreferrer nofollow'
        className='font-medium underline underline-offset-4'
      >
        {children}
      </a>
    ) : (
      <>{children}</>
    ),
  blockquote: ({ children }) => (
    <blockquote className='my-3 border-s-2 border-border ps-3 text-muted-foreground'>
      {children}
    </blockquote>
  ),
  hr: () => <hr className='my-5 border-border' />,
  table: ({ children }) => (
    <div className='my-3 overflow-x-auto'>
      <table className='w-full border-collapse text-xs'>{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className='border border-border bg-muted/40 px-2 py-1 text-start font-semibold'>
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className='border border-border px-2 py-1'>{children}</td>
  ),
  code: ({ children }) => (
    <code className='rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] wrap-anywhere'>
      {children}
    </code>
  ),
  pre: ({ children }) => {
    const block = isValidElement<{
      className?: string
      children?: React.ReactNode
    }>(children)
      ? children.props
      : {}
    const code = String(block.children ?? '').replace(/\n$/, '')
    const language = /language-(\w+)/.exec(block.className ?? '')?.[1] ?? ''

    if (isHighlightLanguage(language)) {
      return (
        <div className='my-3 overflow-hidden rounded-md border border-border bg-card'>
          <HighlightedCode
            code={code}
            language={language}
            className='p-3 text-xs wrap-anywhere whitespace-pre-wrap'
          />
        </div>
      )
    }
    return (
      <pre className='my-3 overflow-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-xs wrap-anywhere whitespace-pre-wrap'>
        <code>{code}</code>
      </pre>
    )
  },
}

// No rehype-raw, so quoted page markup stays text; images are dropped so nothing remote loads.
export const FixReportMarkdown: React.FC<FixReportMarkdownProps> = ({
  content,
}) => {
  return (
    <div className='text-sm leading-relaxed *:first:mt-0 *:last:mb-0'>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
        disallowedElements={['img']}
        unwrapDisallowed
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
