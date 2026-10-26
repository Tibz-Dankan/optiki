import { cn } from '@utils/classname'
import { getScoreTone } from '@utils/get-score-tone'

type ScoreBarProps = {
  score: number
  tone?: string
  className?: string
}

const minimumFill = 2

export const ScoreBar: React.FC<ScoreBarProps> = ({
  score,
  tone,
  className,
}) => {
  return (
    <div
      aria-hidden='true'
      className={cn(
        'mt-1.5 h-1.25 overflow-hidden rounded-full bg-muted',
        className
      )}
    >
      <div
        className={cn(
          'h-full rounded-full bg-current',
          tone ?? getScoreTone(score)
        )}
        style={{ width: `${Math.max(score, minimumFill)}%` }}
      />
    </div>
  )
}
