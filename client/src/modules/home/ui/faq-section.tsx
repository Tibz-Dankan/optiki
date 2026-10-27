import { Plus } from 'lucide-react'
import { githubActionHref } from '@constants/links'
import { LandingSection } from '@modules/home/ui/landing-section'
import { SectionHeading } from '@modules/home/ui/section-heading'

const faqs = [
  {
    question: 'What is agentic AI eligibility?',
    answer:
      "It's how well an AI agent can use your page: find the controls, read what they say, and act on them. optikí scores it from 0 to 100 using 17 rules that answer four questions: can an agent act, can it read the page, does the page hold still, and can it find its way around.",
  },
  {
    question: 'How is this different from SEO?',
    answer:
      "SEO tools check how search engines find and rank a page. optikí checks what happens once an agent is on it: whether it can read the accessibility tree, name every control and complete a task. Keywords and backlinks don't help an agent click the right button. The two work side by side.",
  },
  {
    question: 'Do I need to change my code?',
    answer:
      'Not to scan. optikí reads your public page as it is, with nothing to install. To raise the score, you fix what it finds. Every finding comes with a before-and-after snippet, and the fix report is a prompt your coding agent can apply.',
  },
  {
    question: 'Does it work on JavaScript-heavy sites?',
    answer:
      "Yes. Signed-in scans load the page in a real Chromium browser, so client-rendered content is checked after it renders. That's also how timing rules work, like controls that appear late or layouts that shift while an agent aims.",
  },
  {
    question: 'Is my data safe?',
    answer:
      'optikí only scans public addresses and refuses private or internal ones. Signed-in scans are private by default, and you decide when to share one or delete it.',
  },
  {
    question: 'How does the pull request integration work?',
    answer: (
      <>
        Create an API token, save it as the <code>OPTIKI_API_TOKEN</code>{' '}
        secret, and add the{' '}
        <a
          href={githubActionHref}
          className='font-semibold text-foreground underline underline-offset-4 transition-colors hover:text-primary'
        >
          optikí GitHub Action
        </a>{' '}
        to your workflow, pointed at the pull request's preview URL. It writes
        the scores and findings to the run summary and can fail the job when the
        score is below your <code>minScore</code>. Any other CI can call the
        scan API with the same token.
      </>
    ),
  },
]

export const FaqSection: React.FC = () => {
  return (
    <LandingSection
      id='faq'
      labelledBy='faq-title'
      containerClassName='max-w-215'
    >
      <SectionHeading
        id='faq-title'
        eyebrow='FAQ'
        title='Questions, answered.'
      />
      <div className='mt-10 border-t border-border'>
        {faqs.map((faq, index) => (
          <details
            key={faq.question}
            open={index === 0}
            className='group border-b border-border'
          >
            <summary className='flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-semibold transition-colors hover:text-primary [&::-webkit-details-marker]:hidden'>
              {faq.question}
              <Plus
                className='size-4.5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45'
                aria-hidden
              />
            </summary>
            <p className='mb-5.5 max-w-170 text-[15px] leading-[1.65] text-muted-foreground'>
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </LandingSection>
  )
}
