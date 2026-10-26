import { cn } from '@utils/classname'
import { getScoreTone } from '@utils/get-score-tone'

type ScoreGaugeProps = {
  score: number | null
  isPending?: boolean
  tone?: string
  className?: string
}

const radius = 52
const circumference = 2 * Math.PI * radius
const minimumFill = 2

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  isPending = false,
  tone,
  className,
}) => {
  return (
    <svg
      aria-hidden='true'
      viewBox='0 0 120 120'
      className={cn('size-34 -rotate-90', className)}
    >
      <circle
        cx='60'
        cy='60'
        r={radius}
        fill='none'
        strokeWidth='6.67'
        strokeDasharray={isPending ? '4 6' : undefined}
        className='stroke-muted'
      />
      {score !== null && !isPending && (
        <circle
          cx='60'
          cy='60'
          r={radius}
          fill='none'
          strokeWidth='6.67'
          stroke='currentColor'
          strokeLinecap='round'
          strokeDasharray={`${(Math.max(score, minimumFill) / 100) * circumference} ${circumference}`}
          className={tone ?? getScoreTone(score)}
        />
      )}
    </svg>
  )
}
