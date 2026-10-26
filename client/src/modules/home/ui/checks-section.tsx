import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { TRuleCategory } from '@typings/scan'
import { cn } from '@utils/classname'
import { getScoreTone } from '@utils/get-score-tone'
import { LandingSection } from '@modules/home/ui/landing-section'
import { SectionHeading } from '@modules/home/ui/section-heading'
import { ScoreBar } from '@modules/scan/ui/score-bar'

const criteria: {
  category: TRuleCategory
  rules: string
  name: string
  text: string
  score: number
}[] = [
  {
    category: 'OPERABLE',
    rules: 'OPT-101',
    name: 'Visible controls',
    text: 'Controls exist in the accessibility tree, not just on screen.',
    score: 100,
  },
  {
    category: 'OPERABLE',
    rules: 'OPT-102 · 103',
    name: 'Named controls',
    text: 'Every button, link and menu item has a name an agent can say back.',
    score: 62,
  },
  {
    category: 'OPERABLE',
    rules: 'OPT-104 · 105',
    name: 'Real controls',
    text: 'Clickable things are buttons and links, not divs, and never nested.',
    score: 88,
  },
  {
    category: 'OPERABLE',
    rules: 'OPT-106 · 107',
    name: 'Labeled fields',
    text: 'Inputs keep a label while you type, and no native pop-up blocks the page.',
    score: 70,
  },
  {
    category: 'PERCEIVABLE',
    rules: 'OPT-201 · 205',
    name: 'Honest labels',
    text: 'Accessible names match the visible words, and every reference points somewhere real.',
    score: 95,
  },
  {
    category: 'PERCEIVABLE',
    rules: 'OPT-202 – 204',
    name: 'Readable content',
    text: 'Images have alt text, meaning isn’t locked in graphics, and text is big enough to read.',
    score: 72,
  },
  {
    category: 'STABLE',
    rules: 'OPT-301 · 302',
    name: 'Stable layout',
    text: 'Controls are there on first look and don’t jump while an agent aims.',
    score: 92,
  },
  {
    category: 'DISCOVERABLE',
    rules: 'OPT-401 – 403',
    name: 'Page anchors',
    text: 'A title, one h1, a main landmark, named dialogs and titled frames.',
    score: 64,
  },
]

export const ChecksSection: React.FC = () => {
  return (
    <LandingSection id='checks' labelledBy='checks-title' isBand>
      <SectionHeading
        id='checks-title'
        eyebrow='17 rules · 4 questions'
        title='What optikí checks'
      >
        Can an agent act? Can it read the page? Does the page hold still? Can it
        find its way around? Every rule comes from a failure logged in a real AI
        test run.
      </SectionHeading>
      <div className='mt-12 grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4'>
        {criteria.map((criterion) => (
          <article
            key={criterion.name}
            className='flex flex-col gap-3 rounded-lg border border-border bg-card p-5.5 transition-[border-color,translate] duration-200 hover:-translate-y-0.5 hover:border-input'
          >
            <div className='flex items-center justify-between gap-2'>
              <span className='rounded-[4px] bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold tracking-[0.08em] text-primary'>
                {criterion.category}
              </span>
              <span className='font-mono text-[11px] text-muted-foreground'>
                {criterion.rules}
              </span>
            </div>
            <h3 className='text-[17px] font-[650]'>{criterion.name}</h3>
            <p className='grow text-sm leading-[1.55] text-muted-foreground'>
              {criterion.text}
            </p>
            <div className='flex items-center gap-2.5'>
              <ScoreBar score={criterion.score} className='mt-0 h-1.5 grow' />
              <span
                className={cn(
                  'min-w-7 text-right font-mono text-[13px] font-bold',
                  getScoreTone(criterion.score)
                )}
              >
                <span className='sr-only'>Sample score </span>
                {criterion.score}
              </span>
            </div>
          </article>
        ))}
      </div>
      <div className='mt-5 flex flex-wrap items-center justify-between gap-3'>
        <p className='font-mono text-xs text-muted-foreground'>
          Bars show a sample scan of your-site.com.
        </p>
        <Link
          to='/rules'
          className='inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline hover:underline-offset-4'
        >
          Browse all 17 rules
          <ArrowRight className='size-3.5' aria-hidden />
        </Link>
      </div>
    </LandingSection>
  )
}
