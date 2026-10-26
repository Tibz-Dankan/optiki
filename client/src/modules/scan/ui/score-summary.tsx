import {
  categoryLabels,
  categoryOrder,
  categoryQuestions,
  severityLabels,
} from '@constants/scan'
import type {
  TPageCounts,
  TScanRuleResult,
  TScanScores,
  TSeverity,
} from '@typings/scan'
import { cn } from '@utils/classname'
import { getCategoryScore } from '@utils/get-category-score'
import { ScoreBar } from '@modules/scan/ui/score-bar'
import { ScoreGauge } from '@modules/scan/ui/score-gauge'

type ScoreSummaryProps = {
  scores: TScanScores
  rules?: TScanRuleResult[]
  counts?: TPageCounts
  note?: string
  findingsNote?: string
  pendingText?: string
  className?: string
}

const severityOrder: TSeverity[] = ['CRITICAL', 'SERIOUS', 'MODERATE', 'MINOR']

const severityFills: Record<TSeverity, string> = {
  CRITICAL: 'bg-destructive',
  SERIOUS: 'bg-warning',
  MODERATE: 'bg-muted-foreground',
  MINOR: 'bg-muted-foreground/40',
}

const FindingsBreakdown: React.FC<{
  counts: TPageCounts
  note?: string
  isPending: boolean
}> = ({ counts, note, isPending }) => {
  const severityCounts: Record<TSeverity, number> = {
    CRITICAL: counts.critical,
    SERIOUS: counts.serious,
    MODERATE: counts.moderate,
    MINOR: counts.minor,
  }
  const total = severityOrder.reduce(
    (sum, severity) => sum + severityCounts[severity],
    0
  )

  return (
    <div className='grid gap-2.5 border-t border-border pt-4'>
      <div className='flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-[13px]'>
        <span className='font-medium'>
          {counts.findings === 0 && !isPending
            ? 'No findings'
            : `${counts.findings} ${counts.findings === 1 ? 'finding' : 'findings'}${isPending ? ' so far' : ''}`}
        </span>
        {note && <span className='text-muted-foreground'>{note}</span>}
      </div>
      {total > 0 && (
        <div
          aria-hidden='true'
          className='flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted'
        >
          {severityOrder
            .filter((severity) => severityCounts[severity] > 0)
            .map((severity) => (
              <div
                key={severity}
                className={severityFills[severity]}
                style={{
                  width: `${(severityCounts[severity] / total) * 100}%`,
                }}
              />
            ))}
        </div>
      )}
      <ul className='flex flex-wrap gap-x-4.5 gap-y-1.5 text-[13px]'>
        {severityOrder.map((severity) => (
          <li key={severity} className='inline-flex items-center gap-1.5'>
            <span
              aria-hidden='true'
              className={cn('size-2 rounded-xs', severityFills[severity])}
            />
            <span className='text-muted-foreground'>
              {severityLabels[severity]}
            </span>
            <span className='font-semibold'>{severityCounts[severity]}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export const ScoreSummary: React.FC<ScoreSummaryProps> = ({
  scores,
  rules = [],
  counts,
  note,
  findingsNote,
  pendingText,
  className,
}) => {
  const isPending = !!pendingText

  return (
    <section
      aria-labelledby='scores-heading'
      className={cn(
        'grid content-start gap-5 rounded-lg border border-border bg-card p-5',
        className
      )}
    >
      <div className='flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1'>
        <h2 id='scores-heading' className='text-base font-semibold'>
          Scores
        </h2>
        {note && <span className='text-xs text-muted-foreground'>{note}</span>}
      </div>

      <div className='flex flex-wrap items-center gap-6'>
        <div className='relative flex shrink-0 items-center justify-center'>
          <ScoreGauge score={scores.overall} isPending={isPending} />
          <div className='absolute text-center'>
            <p
              className={cn(
                'text-[32px] leading-tight font-bold',
                isPending && 'text-muted-foreground'
              )}
            >
              {isPending ? '—' : (scores.overall ?? '—')}
            </p>
            <p className='text-xs text-muted-foreground'>Overall score</p>
          </div>
        </div>

        {pendingText ? (
          <p className='flex-[1_1_280px] text-sm leading-normal text-muted-foreground'>
            {pendingText}
          </p>
        ) : (
          <dl className='grid flex-[1_1_320px] grid-cols-2 gap-2.5'>
            {categoryOrder.map((category) => {
              const categoryRules = rules.filter(
                (rule) => rule.category === category
              )
              const needsRender =
                categoryRules.length > 0 &&
                categoryRules.every((rule) => rule.result === 'NEEDS_RENDERED')
              const score = getCategoryScore(scores, category)
              return (
                <div
                  key={category}
                  className='grid content-start gap-1 rounded-lg border border-border bg-background p-3'
                >
                  <dt className='text-sm font-medium'>
                    {categoryLabels[category]}
                    <span className='block text-xs font-normal text-muted-foreground'>
                      {categoryQuestions[category]}
                    </span>
                  </dt>
                  <dd
                    className={cn(
                      'font-semibold',
                      score === null && needsRender ? 'text-sm' : 'text-[22px]'
                    )}
                  >
                    {score ?? (needsRender ? 'Needs rendered scan' : '—')}
                    {score !== null && <ScoreBar score={score} />}
                  </dd>
                </div>
              )
            })}
          </dl>
        )}
      </div>

      {counts && (
        <FindingsBreakdown
          counts={counts}
          note={findingsNote}
          isPending={isPending}
        />
      )}
    </section>
  )
}
