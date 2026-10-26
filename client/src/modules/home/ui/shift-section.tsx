import { Bot, EyeOff, MessageSquareText } from 'lucide-react'
import { LandingSection } from '@modules/home/ui/landing-section'
import { SectionHeading } from '@modules/home/ui/section-heading'

const shifts = [
  {
    icon: Bot,
    title: 'Agents browse for people',
    text: 'Assistants open pages, fill forms and compare options for the person asking. Your site is talking to software first.',
  },
  {
    icon: EyeOff,
    title: 'Built for eyes gets misread',
    text: 'An icon-only button is just "button" to an agent. A placeholder isn\'t a label. What a person infers, an agent guesses, or skips.',
  },
  {
    icon: MessageSquareText,
    title: 'AI answers are a real channel',
    text: 'When an assistant sums up a category, the sites it can read are the ones it can recommend. Being legible keeps you in the answer.',
  },
]

export const ShiftSection: React.FC = () => {
  return (
    <LandingSection
      id='product'
      labelledBy='shift-title'
      className='border-t border-border'
    >
      <SectionHeading
        id='shift-title'
        eyebrow='The shift'
        title='Your next customer may never visit your homepage.'
      >
        They'll ask an assistant. The assistant visits for them, reads what it
        can, and answers. Whatever it can't read doesn't make the answer.
      </SectionHeading>
      <div className='mt-12 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4'>
        {shifts.map((shift) => (
          <article
            key={shift.title}
            className='flex flex-col gap-3.5 rounded-lg border border-border bg-card p-6.5 transition-[border-color,translate] duration-200 hover:-translate-y-0.5 hover:border-input'
          >
            <span
              aria-hidden='true'
              className='flex size-10.5 items-center justify-center rounded-lg bg-primary/10 text-primary'
            >
              <shift.icon className='size-5' />
            </span>
            <h3 className='text-[19px] font-[650] tracking-[-0.01em]'>
              {shift.title}
            </h3>
            <p className='text-[15px] leading-[1.6] text-muted-foreground'>
              {shift.text}
            </p>
          </article>
        ))}
      </div>
    </LandingSection>
  )
}
