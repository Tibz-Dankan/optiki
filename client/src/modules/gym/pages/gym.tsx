import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { API_ORIGIN } from '@constants/urls'
import { gymAPI, gymKeys } from '@api/gym'
import { Badge } from '@shared/ui/badge'
import { Button } from '@shared/ui/button'
import { Skeleton } from '@shared/ui/skeleton'
import { HomeLayout } from '@modules/home/layout/home-layout'

export const Gym: React.FC = () => {
  const { data, isPending, isError, error } = useQuery({
    queryKey: gymKeys.list(),
    queryFn: gymAPI.getAll,
    staleTime: 60 * 60 * 1000,
  })

  return (
    <HomeLayout>
      <div className='mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)] gap-6 px-6 py-12'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Gym</h1>
          <p className='mt-2 text-muted-foreground'>
            One intentionally broken page and its fixed twin for every rule.
            Open a page to see it, or paste its address on the{' '}
            <Link
              to='/scan'
              className='font-medium underline underline-offset-4'
            >
              Scan page
            </Link>{' '}
            to see the finding.
          </p>
        </div>

        {isPending && <Skeleton className='h-96 w-full' />}
        {isError && (
          <p role='alert' className='text-sm text-destructive'>
            {error.message}
          </p>
        )}

        {data && (
          <ul className='grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'>
            {data.data.pairs.map((pair) => (
              <li
                key={pair.id}
                className='flex flex-col gap-3 rounded-lg border border-border p-4'
              >
                <div>
                  <h2 className='font-semibold'>
                    <span className='font-mono'>{pair.ruleID}</span>{' '}
                    {pair.ruleName}
                  </h2>
                  <p className='text-sm text-muted-foreground'>{pair.scene}</p>
                  {pair.needsRender && (
                    <Badge variant='outline' className='mt-2'>
                      Shows only in a rendered scan
                    </Badge>
                  )}
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Button asChild size='sm' variant='outline'>
                    <a
                      href={`${API_ORIGIN}${pair.brokenPath}`}
                      target='_blank'
                      rel='noreferrer'
                    >
                      Open {pair.ruleID} broken page
                    </a>
                  </Button>
                  <Button asChild size='sm' variant='outline'>
                    <a
                      href={`${API_ORIGIN}${pair.fixedPath}`}
                      target='_blank'
                      rel='noreferrer'
                    >
                      Open {pair.ruleID} fixed page
                    </a>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </HomeLayout>
  )
}
