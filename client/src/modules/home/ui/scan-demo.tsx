import { useEffect, useState } from 'react'
import { Check, Globe, LoaderCircle, RotateCcw, X } from 'lucide-react'
import { categoryLabels } from '@constants/scan'
import type { TRuleCategory } from '@typings/scan'
import { cn } from '@utils/classname'
import { getScoreTone } from '@utils/get-score-tone'
import { AppLogo } from '@shared/ui/app-logo'
import { Button } from '@shared/ui/button'
import { SampleChip } from '@modules/home/ui/sample-chip'
import { ScoreBar } from '@modules/scan/ui/score-bar'
import { ScoreGauge } from '@modules/scan/ui/score-gauge'

const demoUrl = 'https://your-site.com/pricing'
const demoScore = 74

const demoChecks = [
  { name: 'Page anchors', rule: 'OPT-401', issues: 0 },
  { name: 'Named controls', rule: 'OPT-102', issues: 3 },
  { name: 'Field labels', rule: 'OPT-106', issues: 1 },
  { name: 'Image text', rule: 'OPT-203', issues: 4 },
  { name: 'Honest labels', rule: 'OPT-201', issues: 0 },
  { name: 'Stable layout', rule: 'OPT-302', issues: 0 },
]

const demoCategories: { category: TRuleCategory; score: number }[] = [
  { category: 'OPERABLE', score: 68 },
  { category: 'PERCEIVABLE', score: 72 },
  { category: 'STABLE', score: 92 },
  { category: 'DISCOVERABLE', score: 64 },
]

const typeStart = 300
const typeStep = 45
const checksStart = typeStart + Math.min(demoUrl.length, 48) * typeStep + 400
const checkStep = 650
const checksEnd = checksStart + demoChecks.length * checkStep
const ringMs = 1200
const ringEnd = checksEnd + ringMs
const loopMs = Math.max(ringEnd + 5200, 12000)
const tickMs = 80

const demoIssues = [
  {
    severity: 'CRIT',
    tone: 'danger',
    rule: 'OPT-102',
    text: '3 buttons have no name an agent can read',
    at: ringEnd,
  },
  {
    severity: 'SER',
    tone: 'warning',
    rule: 'OPT-106',
    text: 'Email field is labeled only by its placeholder',
    at: ringEnd + 350,
  },
  {
    severity: 'MOD',
    tone: 'neutral',
    rule: 'OPT-203',
    text: '4 images have no alt text',
    at: ringEnd + 700,
  },
] as const

export const ScanDemo: React.FC = () => {
  const [isReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  const [elapsed, setElapsed] = useState(0)
  const [run, setRun] = useState(0)

  useEffect(() => {
    if (isReducedMotion) return
    const startedAt = performance.now()
    const timer = window.setInterval(
      () => setElapsed((performance.now() - startedAt) % loopMs),
      tickMs
    )
    return () => window.clearInterval(timer)
  }, [isReducedMotion, run])

  const replay = () => {
    setElapsed(0)
    setRun(run + 1)
  }

  const t = isReducedMotion ? loopMs - 1 : elapsed
  const typedCount = Math.max(
    0,
    Math.min(demoUrl.length, Math.floor((t - typeStart) / typeStep))
  )
  const isTyping = t < checksStart
  const isFinished = t >= ringEnd
  const isScanning = !isTyping && !isFinished
  const progress = Math.max(0, Math.min(1, (t - checksEnd) / ringMs))
  const eased = 1 - Math.pow(1 - progress, 3)
  const hasScore = progress > 0
  const score = Math.round(demoScore * eased)

  return (
    <figure>
      <figcaption className='sr-only'>
        Example scan of {demoUrl}: six checks run, three find issues, and the
        page scores {demoScore} out of 100.
      </figcaption>
      <div
        aria-hidden='true'
        className='overflow-hidden rounded-lg border border-input bg-card shadow-[0_40px_80px_-40px_rgb(15_23_42/0.25)] dark:shadow-[0_40px_80px_-40px_rgb(0_0_0/0.7)]'
      >
        <div className='flex items-center gap-3 border-b border-border px-4 py-3'>
          <AppLogo alt='' className='size-5.5' />
          <div className='flex h-9 min-w-0 flex-auto items-center gap-2 rounded-lg border border-border bg-muted/60 px-3 font-mono text-[13px]'>
            <Globe className='size-3.5 shrink-0 text-muted-foreground' />
            <span className='min-w-0 truncate'>
              {demoUrl.slice(0, typedCount)}
            </span>
            {isTyping && (
              <span className='h-4 w-0.5 shrink-0 animate-caret-blink bg-primary' />
            )}
          </div>
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-xs px-2 py-0.75 font-mono text-xs font-semibold',
              isFinished && 'bg-success text-background',
              isScanning && 'bg-info text-background',
              isTyping && 'bg-muted text-muted-foreground'
            )}
          >
            <span
              className={cn(
                'size-1.5 rounded-full bg-current',
                isScanning && 'animate-status-blink'
              )}
            />
            {isFinished ? 'done' : isScanning ? 'scanning' : 'ready'}
          </span>
        </div>

        <div className='grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))]'>
          <div className='flex flex-col gap-1 px-5 py-4.5'>
            <span className='mb-2 font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase'>
              Checks
            </span>
            {demoChecks.map((check, index) => {
              const begin = checksStart + index * checkStep
              const isPending = t < begin
              const isRunning = !isPending && t < begin + checkStep
              const isDone = !isPending && !isRunning
              const isFail = isDone && check.issues > 0
              const isPass = isDone && check.issues === 0
              return (
                <div
                  key={check.rule}
                  className={cn(
                    'flex min-h-10 items-center gap-3 rounded-lg px-2.5',
                    isRunning && 'bg-primary/8'
                  )}
                >
                  <span className='flex size-5 shrink-0 items-center justify-center'>
                    {isPending && (
                      <span className='size-3 rounded-full border-2 border-muted' />
                    )}
                    {isRunning && (
                      <LoaderCircle
                        className='size-4 animate-spin text-primary'
                        strokeWidth={2.5}
                      />
                    )}
                    {isDone && (
                      <span
                        className={cn(
                          'flex size-4.5 items-center justify-center rounded-sm text-background',
                          isPass ? 'bg-success' : 'bg-destructive'
                        )}
                      >
                        {isPass ? (
                          <Check className='size-2.75' strokeWidth={3.5} />
                        ) : (
                          <X className='size-2.75' strokeWidth={3.5} />
                        )}
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      'min-w-0 flex-auto text-sm font-medium',
                      isPending && 'text-muted-foreground'
                    )}
                  >
                    {check.name}
                  </span>
                  <span className='font-mono text-[11px] text-muted-foreground'>
                    {check.rule}
                  </span>
                  <span
                    className={cn(
                      'min-w-16 text-right font-mono text-xs font-semibold text-muted-foreground',
                      isPass && 'text-success',
                      isFail && 'text-destructive'
                    )}
                  >
                    {isRunning && 'checking'}
                    {isPass && 'pass'}
                    {isFail &&
                      `${check.issues} ${check.issues === 1 ? 'issue' : 'issues'}`}
                  </span>
                </div>
              )
            })}
          </div>

          <div className='flex flex-col gap-4 border-l border-border px-5 py-4.5'>
            <span className='font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase'>
              Agentic AI Eligibility
            </span>
            <div className='flex flex-wrap items-center gap-5'>
              <div className='relative flex size-31 shrink-0 items-center justify-center'>
                <ScoreGauge
                  score={hasScore ? score : null}
                  tone={getScoreTone(demoScore)}
                  className='size-31'
                />
                <div className='absolute flex flex-col items-center'>
                  <span className='font-mono text-[32px] leading-none font-bold'>
                    {hasScore ? score : '—'}
                  </span>
                  <span className='mt-1 font-mono text-[11px] text-muted-foreground'>
                    / 100
                  </span>
                </div>
              </div>
              <div className='flex flex-[1_1_160px] flex-col gap-2.5'>
                {demoCategories.map(({ category, score: categoryScore }) => {
                  const value = Math.round(categoryScore * eased)
                  return (
                    <div key={category} className='flex flex-col gap-1'>
                      <div className='flex justify-between text-xs'>
                        <span className='text-muted-foreground'>
                          {categoryLabels[category]}
                        </span>
                        <span className='font-mono font-semibold'>
                          {hasScore ? value : '—'}
                        </span>
                      </div>
                      {hasScore ? (
                        <ScoreBar
                          score={value}
                          tone={getScoreTone(categoryScore)}
                          className='mt-0 h-1'
                        />
                      ) : (
                        <div className='h-1 rounded-full bg-muted' />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            <div className='flex flex-col gap-2'>
              {demoIssues.map((issue) => (
                <div
                  key={issue.rule}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg border border-border bg-muted/60 px-3 py-2.25 transition-[opacity,translate] duration-400 ease-out',
                    t >= issue.at ? 'opacity-100' : 'translate-y-2 opacity-0'
                  )}
                >
                  <SampleChip
                    tone={issue.tone}
                    className='px-1.5 py-px text-[11px]'
                  >
                    {issue.severity}
                  </SampleChip>
                  <span className='shrink-0 font-mono text-xs text-muted-foreground'>
                    {issue.rule}
                  </span>
                  <span className='min-w-0 truncate text-[13px]'>
                    {issue.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className='mt-2.5 flex justify-end'>
        <Button
          type='button'
          variant='ghost'
          size='sm'
          onClick={replay}
          className='h-8 border border-border text-xs text-muted-foreground'
        >
          <RotateCcw className='size-3.25' aria-hidden />
          Replay the example scan
        </Button>
      </div>
    </figure>
  )
}
