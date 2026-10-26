import {
  categoryLabels,
  categoryOrder,
  categoryQuestions,
} from '@constants/scan'
import type { TRuleCategory, TScanRuleResult, TScanScores } from '@typings/scan'
import { cn } from '@utils/classname'

type ScoreSummaryProps = {
  scores: TScanScores
  rules: TScanRuleResult[]
}

const categoryScore = (scores: TScanScores, category: TRuleCategory) => {
  switch (category) {
    case 'OPERABLE':
      return scores.operable
    case 'PERCEIVABLE':
      return scores.perceivable
    case 'STABLE':
      return scores.stable
    case 'DISCOVERABLE':
      return scores.discoverable
  }
}

const scoreTone = (score: number) => {
  if (score >= 90) return 'text-success'
  if (score >= 70) return 'text-info'
  if (score >= 50) return 'text-warning'
  return 'text-destructive'
}

const minimumFill = 2

const ScoreGauge: React.FC<{ score: number | null }> = ({ score }) => {
  const radius = 52
  const circumference = 2 * Math.PI * radius
  return (
    <svg
      aria-hidden='true'
      viewBox='0 0 120 120'
      className='size-32 -rotate-90'
    >
      <circle
        cx='60'
        cy='60'
        r={radius}
        fill='none'
        strokeWidth='6.67'
        className='stroke-muted'
      />
      {score !== null && (
        <circle
          cx='60'
          cy='60'
          r={radius}
          fill='none'
          strokeWidth='6.67'
          stroke='currentColor'
          strokeLinecap='round'
          strokeDasharray={`${(Math.max(score, minimumFill) / 100) * circumference} ${circumference}`}
          className={scoreTone(score)}
        />
      )}
    </svg>
  )
}

const ScoreBar: React.FC<{ score: number }> = ({ score }) => {
  return (
    <div
      aria-hidden='true'
      className='mt-2 h-1.25 overflow-hidden rounded-full bg-muted'
    >
      <div
        className={cn('h-full rounded-full bg-current', scoreTone(score))}
        style={{ width: `${Math.max(score, minimumFill)}%` }}
      />
    </div>
  )
}

export const ScoreSummary: React.FC<ScoreSummaryProps> = ({
  scores,
  rules,
}) => {
  return (
    <section
      aria-labelledby='scores-heading'
      className='grid gap-6 rounded-lg border border-border p-6 md:grid-cols-[auto_minmax(0,1fr)]'
    >
      <h2 id='scores-heading' className='sr-only'>
        Scores
      </h2>
      <div className='relative flex items-center justify-center'>
        <ScoreGauge score={scores.overall} />
        <div className='absolute text-center'>
          <p className='text-3xl font-bold'>{scores.overall ?? '—'}</p>
          <p className='text-xs text-muted-foreground'>Overall score</p>
        </div>
      </div>

      <dl className='grid gap-3 sm:grid-cols-2'>
        {categoryOrder.map((category) => {
          const categoryRules = rules.filter(
            (rule) => rule.category === category
          )
          const needsRender =
            categoryRules.length > 0 &&
            categoryRules.every((rule) => rule.result === 'NEEDS_RENDERED')
          const score = categoryScore(scores, category)
          return (
            <div
              key={category}
              className='rounded-md border border-border bg-card p-3'
            >
              <dt className='text-sm font-medium'>
                {categoryLabels[category]}
                <span className='block text-xs font-normal text-muted-foreground'>
                  {categoryQuestions[category]}
                </span>
              </dt>
              <dd className='mt-1 text-2xl font-semibold'>
                {score ?? (needsRender ? 'Needs rendered scan' : '—')}
                {score !== null && <ScoreBar score={score} />}
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}
