import { LandingSection } from '@modules/home/ui/landing-section'
import { SectionHeading } from '@modules/home/ui/section-heading'

const steps = [
  {
    title: 'Paste a URL',
    text: 'Any public page. No install, no snippet, and no account for your first three scans.',
  },
  {
    title: 'optikí scans it like an agent',
    text: 'It loads the page in a real browser and reads the accessibility tree that agents and screen readers use.',
  },
  {
    title: 'Get your score and fix report',
    text: 'One score from 0 to 100, every finding with its selector, and a fix you can copy or hand to your coding agent.',
  },
  {
    title: 'Ship fixes and re-scan',
    text: 'Re-scan to confirm the fix. Run it from CI and every pull request gets checked before it merges.',
  },
]

export const HowItWorksSection: React.FC = () => {
  return (
    <LandingSection id='how' labelledBy='how-title' isBand>
      <SectionHeading
        id='how-title'
        eyebrow='How it works'
        title='From URL to fix in four steps.'
      />
      <ol className='mt-12 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-x-6 gap-y-8'>
        {steps.map((step, index) => (
          <li
            key={step.title}
            className='relative flex flex-col gap-3 border-t border-input pt-6'
          >
            <span
              aria-hidden='true'
              className='absolute -top-0.5 left-0 h-0.75 w-12 rounded-xs bg-primary'
            />
            <span className='font-mono text-sm font-bold text-primary'>
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3 className='text-[19px] font-[650]'>{step.title}</h3>
            <p className='text-[15px] leading-[1.6] text-muted-foreground'>
              {step.text}
            </p>
          </li>
        ))}
      </ol>
    </LandingSection>
  )
}
