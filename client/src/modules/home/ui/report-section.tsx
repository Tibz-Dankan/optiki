import { Check, Copy, Sparkles } from 'lucide-react'
import { categoryLabels } from '@constants/scan'
import type { TRuleCategory } from '@typings/scan'
import { useCopyToClipboard } from '@hooks/use-copy-to-clipboard'
import { Button } from '@shared/ui/button'
import { HighlightedCode } from '@shared/ui/highlighted-code'
import { LandingSection } from '@modules/home/ui/landing-section'
import { SampleChip } from '@modules/home/ui/sample-chip'
import { SectionHeading } from '@modules/home/ui/section-heading'
import { ScoreBar } from '@modules/scan/ui/score-bar'
import { ScoreGauge } from '@modules/scan/ui/score-gauge'

const sampleScore = 74

const sampleCategories: { category: TRuleCategory; score: number }[] = [
  { category: 'OPERABLE', score: 68 },
  { category: 'PERCEIVABLE', score: 72 },
  { category: 'STABLE', score: 92 },
  { category: 'DISCOVERABLE', score: 64 },
]

const fixBefore = '<input type="email" placeholder="Work email">'
const fixAfter =
  '<label for="email">Work email</label>\n<input id="email" type="email">'

const codeRowClassName =
  'p-0 overflow-visible text-[13px] leading-[1.65] whitespace-pre-wrap wrap-anywhere'

export const ReportSection: React.FC = () => {
  const { copied, copy } = useCopyToClipboard(1600)

  return (
    <LandingSection labelledBy='report-title'>
      <SectionHeading
        id='report-title'
        eyebrow='Report & fixes'
        title='A score you can explain. A fix you can paste.'
      >
        Every finding points at the exact element, says why it trips up an
        agent, and comes with a before-and-after you can copy.
      </SectionHeading>
      <div className='mt-12 grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-stretch gap-4'>
        <article
          aria-labelledby='breakdown-title'
          className='flex flex-col gap-5.5 rounded-lg border border-border bg-card p-[clamp(20px,3vw,28px)]'
        >
          <div className='flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1.5'>
            <h3 id='breakdown-title' className='text-[17px] font-[650]'>
              Score breakdown
            </h3>
            <span className='font-mono text-xs text-muted-foreground'>
              your-site.com/pricing
            </span>
          </div>
          <div className='flex flex-wrap items-center gap-7'>
            <div className='relative flex size-37 shrink-0 items-center justify-center'>
              <ScoreGauge score={sampleScore} className='size-37' />
              <div className='absolute flex flex-col items-center'>
                <span className='font-mono text-[38px] leading-none font-bold'>
                  {sampleScore}
                </span>
                <span className='mt-1 text-[11px] text-muted-foreground'>
                  out of 100
                </span>
              </div>
            </div>
            <dl className='flex flex-[1_1_200px] flex-col gap-3'>
              {sampleCategories.map(({ category, score }) => (
                <div
                  key={category}
                  className='grid grid-cols-[minmax(0,1fr)_auto] gap-x-2 gap-y-1.25 text-[13px]'
                >
                  <dt className='text-muted-foreground'>
                    {categoryLabels[category]}
                  </dt>
                  <dd className='font-mono font-bold'>{score}</dd>
                  <dd aria-hidden='true' className='col-span-full'>
                    <ScoreBar score={score} className='mt-0' />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className='flex flex-col gap-3 border-t border-border pt-4.5'>
            <div className='flex flex-wrap gap-2'>
              <SampleChip tone='danger'>3 critical</SampleChip>
              <SampleChip tone='warning'>1 serious</SampleChip>
              <SampleChip tone='neutral'>4 moderate</SampleChip>
            </div>
            <p className='text-sm text-muted-foreground'>
              14 rules passed · 3 failed · rendered in a real browser with a
              screenshot
            </p>
          </div>
        </article>

        <article
          aria-labelledby='finding-title'
          className='flex flex-col gap-4.5 rounded-lg border border-border bg-card p-[clamp(20px,3vw,28px)]'
        >
          <div className='flex flex-wrap items-center gap-2.5'>
            <SampleChip tone='warning'>Serious</SampleChip>
            <span className='font-mono text-[13px] font-semibold text-muted-foreground'>
              OPT-106
            </span>
            <h3 id='finding-title' className='text-[17px] font-[650]'>
              Unlabeled field
            </h3>
          </div>
          <code className='max-w-full self-start rounded-md bg-muted/60 px-2 py-1 font-mono text-xs wrap-anywhere text-muted-foreground'>
            main &gt; form.signup &gt; input[type=email]
          </code>
          <dl className='flex flex-col gap-3.5'>
            <div className='flex flex-col gap-1'>
              <dt className='font-mono text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase'>
                Problem
              </dt>
              <dd className='text-[15px] leading-[1.55]'>
                This field's only label is its placeholder "Work email", which
                disappears as soon as something is typed.
              </dd>
            </div>
            <div className='flex flex-col gap-1'>
              <dt className='font-mono text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase'>
                Why it hurts agents
              </dt>
              <dd className='text-[15px] leading-[1.55] text-muted-foreground'>
                An agent told to enter a work email looks for a field with that
                name. A placeholder isn't a name, so the agent guesses, or
                stops.
              </dd>
            </div>
          </dl>
          <div className='overflow-hidden rounded-lg border border-border'>
            <div className='flex items-center justify-between gap-2.5 border-b border-border bg-muted/60 py-1.5 ps-3.5 pe-1.5'>
              <span className='font-mono text-xs text-muted-foreground'>
                fix · html
              </span>
              <Button
                type='button'
                size='sm'
                className='h-8 text-[13px] font-semibold'
                onClick={() => copy(fixAfter)}
              >
                {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
                {copied ? 'Copied' : 'Copy fix'}
              </Button>
            </div>
            <div className='flex flex-col bg-muted/30 dark:bg-background'>
              <div className='flex gap-3 border-b border-dashed border-border px-3.5 py-3'>
                <span
                  aria-hidden='true'
                  className='w-3.5 shrink-0 font-mono text-[13px] leading-[1.65] font-bold text-destructive'
                >
                  −
                </span>
                <span className='sr-only'>Before:</span>
                <HighlightedCode
                  code={fixBefore}
                  language='html'
                  className={codeRowClassName}
                />
              </div>
              <div className='flex gap-3 bg-primary/10 px-3.5 py-3'>
                <span
                  aria-hidden='true'
                  className='w-3.5 shrink-0 font-mono text-[13px] leading-[1.65] font-bold text-success'
                >
                  +
                </span>
                <span className='sr-only'>After:</span>
                <HighlightedCode
                  code={fixAfter}
                  language='html'
                  className={codeRowClassName}
                />
              </div>
            </div>
          </div>
          <p className='flex items-start gap-2.5 text-sm leading-normal text-muted-foreground'>
            <Sparkles
              className='mt-0.5 size-4 shrink-0 text-primary'
              aria-hidden
            />
            <span>
              Want every fix at once? The fix report is one prompt your coding
              agent (Claude Code, Codex, Cursor) can apply.
            </span>
          </p>
        </article>
      </div>
    </LandingSection>
  )
}
