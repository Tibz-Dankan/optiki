import { cn } from '@utils/classname'
import { getScoreTone } from '@utils/get-score-tone'

type ScoreMeterProps = {
  score: number | null
}

export const ScoreMeter: React.FC<ScoreMeterProps> = ({ score }) => {
  if (score === null) return <span className='text-muted-foreground'>—</span>

  return (
    <div className={cn('flex items-center gap-2.5', getScoreTone(score))}>
      <span className='min-w-5.5 font-semibold tabular-nums'>{score}</span>
      <span
        aria-hidden
        className='h-1 w-13 overflow-hidden rounded-full bg-muted'
      >
        <span
          className='block h-full rounded-full bg-current'
          style={{ width: `${Math.max(score, 2)}%` }}
        />
      </span>
    </div>
  )
}
