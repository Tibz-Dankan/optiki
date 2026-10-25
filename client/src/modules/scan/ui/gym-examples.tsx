import { useQuery } from '@tanstack/react-query'
import { gymAPI, gymKeys } from '@api/gym'
import { Button } from '@shared/ui/button'
import { Skeleton } from '@shared/ui/skeleton'

type GymExamplesProps = {
  isPending: boolean
  onScan: (gymPageID: string) => void
}

export const GymExamples: React.FC<GymExamplesProps> = ({
  isPending,
  onScan,
}) => {
  const {
    data,
    isPending: isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: gymKeys.list(),
    queryFn: gymAPI.getAll,
    staleTime: 60 * 60 * 1000,
  })

  if (isLoading) {
    return <Skeleton className='h-40 w-full' />
  }
  if (isError) {
    return (
      <p role='alert' className='text-sm text-destructive'>
        {error.message}
      </p>
    )
  }

  return (
    <div className='grid gap-4'>
      <div className='flex flex-wrap gap-2'>
        <Button
          type='button'
          disabled={isPending}
          onClick={() => onScan(data.data.kitchenSink.id)}
        >
          Load example Kitchen sink (every rule broken)
        </Button>
        <Button
          type='button'
          variant='outline'
          disabled={isPending}
          onClick={() => onScan(data.data.perfect.id)}
        >
          Load example Perfect page
        </Button>
      </div>
      <ul className='grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'>
        {data.data.pairs.map((pair) => (
          <li
            key={pair.id}
            className='flex flex-col gap-2 rounded-md border border-border p-3'
          >
            <p className='text-sm'>
              <span className='font-mono font-semibold'>{pair.ruleID}</span>{' '}
              {pair.ruleName}
              <span className='block text-xs text-muted-foreground'>
                {pair.scene}
              </span>
            </p>
            <div className='flex flex-wrap gap-2'>
              <Button
                type='button'
                size='sm'
                variant='outline'
                disabled={isPending}
                onClick={() => onScan(pair.broken)}
              >
                Load example {pair.ruleID} broken
              </Button>
              <Button
                type='button'
                size='sm'
                variant='outline'
                disabled={isPending}
                onClick={() => onScan(pair.fixed)}
              >
                Load example {pair.ruleID} fixed
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
