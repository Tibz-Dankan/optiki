import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { categoryLabels, severityLabels } from '@constants/scan'
import { isHttpError } from '@api/http-error'
import { rulesAPI, rulesKeys } from '@api/rules'
import { getCodeLanguage } from '@utils/get-code-language'
import { Badge } from '@shared/ui/badge'
import { CodeBlock } from '@shared/ui/code-block'
import { Skeleton } from '@shared/ui/skeleton'
import { NotFoundError } from '@shared/pages/not-found-error'
import { HomeLayout } from '@modules/home/layout/home-layout'

export const Rule: React.FC = () => {
  const { id = '' } = useParams()
  const { data, isPending, isError, error } = useQuery({
    queryKey: rulesKeys.detail(id),
    queryFn: () => rulesAPI.getOne(id),
    enabled: !!id,
    staleTime: 60 * 60 * 1000,
  })

  if (isError && isHttpError(error) && error.status === 404) {
    return <NotFoundError />
  }

  return (
    <HomeLayout>
      <div className='mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)] gap-6 px-6 py-12'>
        <Link
          to='/rules'
          className='text-sm font-medium underline-offset-4 hover:underline'
        >
          All rules
        </Link>
        {isPending && <Skeleton className='h-96 w-full' />}
        {isError && (
          <p role='alert' className='text-sm text-destructive'>
            {error.message}
          </p>
        )}
        {data && (
          <article className='grid gap-6'>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>
                <span className='font-mono'>{data.data.id}</span>{' '}
                {data.data.name}
              </h1>
              <p className='mt-2 text-muted-foreground'>{data.data.summary}</p>
              <div className='mt-3 flex flex-wrap gap-2'>
                <Badge variant='secondary'>
                  {categoryLabels[data.data.category]}
                </Badge>
                <Badge variant='secondary'>
                  {severityLabels[data.data.severity]}
                </Badge>
                <Badge variant='secondary'>
                  {data.data.ruleSets.includes('CORE')
                    ? 'Core rule set'
                    : 'Full rule set'}
                </Badge>
                {data.data.renderedOnly && (
                  <Badge variant='outline'>Needs a rendered scan</Badge>
                )}
              </div>
            </div>

            <section aria-labelledby='why-heading'>
              <h2 id='why-heading' className='text-lg font-semibold'>
                Why agents fail
              </h2>
              <p className='mt-2'>{data.data.why}</p>
            </section>

            <section aria-labelledby='fix-heading'>
              <h2 id='fix-heading' className='text-lg font-semibold'>
                How to fix
              </h2>
              <p className='mt-2'>{data.data.fix}</p>
              <div className='mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'>
                <CodeBlock
                  title='Before'
                  language={getCodeLanguage(data.data.fixBefore)}
                  code={data.data.fixBefore}
                  copyLabel='Copy before example'
                />
                <CodeBlock
                  title='After'
                  language={getCodeLanguage(data.data.fixAfter)}
                  code={data.data.fixAfter}
                  copyLabel='Copy after example'
                />
              </div>
            </section>

            <dl className='grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm'>
              <dt className='text-muted-foreground'>WCAG</dt>
              <dd>{data.data.wcag || 'No direct WCAG criterion'}</dd>
              <dt className='text-muted-foreground'>Origin</dt>
              <dd>{data.data.origin}</dd>
            </dl>
          </article>
        )}
      </div>
    </HomeLayout>
  )
}
