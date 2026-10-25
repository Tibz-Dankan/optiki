import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  categoryLabels,
  categoryOrder,
  categoryQuestions,
  severityLabels,
} from '@constants/scan'
import { rulesAPI, rulesKeys } from '@api/rules'
import { Badge } from '@shared/ui/badge'
import { Skeleton } from '@shared/ui/skeleton'
import { HomeLayout } from '@modules/home/layout/home-layout'

export const Rules: React.FC = () => {
  const { data, isPending, isError, error } = useQuery({
    queryKey: rulesKeys.list(),
    queryFn: rulesAPI.getAll,
    staleTime: 60 * 60 * 1000,
  })

  return (
    <HomeLayout>
      <div className='mx-auto grid max-w-4xl grid-cols-[minmax(0,1fr)] gap-8 px-6 py-12'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Rules</h1>
          <p className='mt-2 text-muted-foreground'>
            17 checks for the problems that stop AI agents from using a page.
            Signed-out scans run the 9 core rules; signed-in scans and API
            tokens run all of them.
          </p>
        </div>

        {isPending && <Skeleton className='h-96 w-full' />}
        {isError && (
          <p role='alert' className='text-sm text-destructive'>
            {error.message}
          </p>
        )}

        {data &&
          categoryOrder.map((category) => (
            <section key={category} aria-labelledby={`rules-${category}`}>
              <h2 id={`rules-${category}`} className='text-xl font-semibold'>
                {categoryLabels[category]}
                <span className='ms-2 text-sm font-normal text-muted-foreground'>
                  {categoryQuestions[category]}
                </span>
              </h2>
              <ul className='mt-3 grid gap-2'>
                {data.data
                  .filter((rule) => rule.category === category)
                  .map((rule) => (
                    <li
                      key={rule.id}
                      className='flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-border p-3'
                    >
                      <Link
                        to={`/rules/${rule.id}`}
                        className='font-medium underline-offset-4 hover:underline'
                      >
                        <span className='font-mono'>{rule.id}</span> {rule.name}
                      </Link>
                      <span className='text-xs text-muted-foreground'>
                        {severityLabels[rule.severity]}
                      </span>
                      <span className='ms-auto flex gap-1'>
                        <Badge variant='secondary'>
                          {rule.ruleSets.includes('CORE') ? 'Core' : 'Full'}
                        </Badge>
                        {rule.renderedOnly && (
                          <Badge variant='outline'>Rendered only</Badge>
                        )}
                      </span>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
      </div>
    </HomeLayout>
  )
}
