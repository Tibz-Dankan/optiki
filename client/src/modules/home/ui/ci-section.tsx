import { Check, ChevronUp } from 'lucide-react'
import { githubActionHref } from '@constants/links'
import { AppLogo } from '@shared/ui/app-logo'
import { GitHubIcon } from '@shared/ui/github-icon'
import { LandingSection } from '@modules/home/ui/landing-section'
import { SampleChip } from '@modules/home/ui/sample-chip'
import { SectionHeading } from '@modules/home/ui/section-heading'

const prStats = [
  { label: 'Pages scanned', value: 12 },
  { label: 'Rules failing', value: 3 },
  { label: 'New findings', value: 2 },
]

const regressions = [
  {
    change: 'new',
    tone: 'danger',
    rule: 'OPT-102',
    name: 'Unnamed control',
    where: '/checkout',
  },
  {
    change: '+2',
    tone: 'warning',
    rule: 'OPT-203',
    name: 'Image without alt',
    where: '/pricing',
  },
] as const

const statusChecks = [
  { name: 'ci / build', status: 'Passed' },
  { name: 'ci / tests', status: 'Passed' },
]

const chartPoints =
  '36,88 66,84 96,86 126,74 156,70 186,72 216,62 246,58 276,58 306,46'

const chartLabelClassName = 'fill-muted-foreground font-mono text-[10px]'

const floatShadow =
  'shadow-[0_40px_80px_-40px_rgb(15_23_42/0.22)] dark:shadow-[0_40px_80px_-40px_rgb(0_0_0/0.75)]'

const findingRowClassName =
  'flex flex-wrap items-center gap-x-2.5 gap-y-1.5 px-3 py-2.5'

export const CiSection: React.FC = () => {
  return (
    <LandingSection
      id='ci'
      labelledBy='ci-title'
      className='relative scroll-mt-20 overflow-hidden'
      containerClassName='relative'
    >
      <div
        aria-hidden='true'
        className='pointer-events-none absolute top-20 -right-50 size-180 bg-[radial-gradient(closest-side,var(--glow),transparent)]'
      />
      <SectionHeading
        id='ci-title'
        eyebrow='Always on'
        title='A gate, not a report. Every deploy gets scanned.'
        className='relative'
      >
        Call optikí from CI with an API token. Each pull request gets a score,
        the change against main, and the findings that caused it. Fail the check
        when the score drops.
      </SectionHeading>
      <a
        href={githubActionHref}
        className='relative mt-4 inline-flex max-w-full items-center gap-2 rounded-md border border-input px-2.5 py-1.25 font-mono text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground'
      >
        <GitHubIcon className='size-3.5' />
        Run it in GitHub Actions: Tibz-Dankan/optiki-gh-action
      </a>

      <div className='relative mt-12 flex flex-wrap items-start gap-4'>
        <article
          aria-label='Example pull request comment from optiki-bot'
          className={`min-w-0 flex-[999_1_520px] overflow-hidden rounded-lg border border-input bg-card ${floatShadow}`}
        >
          <div className='flex flex-wrap items-center gap-x-2.5 gap-y-2 border-b border-border bg-muted/60 px-4.5 py-3'>
            <AppLogo alt='' className='size-6 rounded-full' />
            <span className='text-sm font-[650]'>optiki-bot</span>
            <span className='rounded-full border border-input px-1.5 text-[11px] font-medium text-muted-foreground'>
              bot
            </span>
            <span className='text-sm text-muted-foreground'>
              commented 2 minutes ago
            </span>
          </div>
          <div className='flex flex-col gap-5 p-[clamp(18px,3vw,24px)]'>
            <div className='flex flex-wrap items-end gap-x-4.5 gap-y-2.5'>
              <div className='flex flex-col gap-1'>
                <span className='font-mono text-xs text-muted-foreground'>
                  Agentic AI Eligibility · this PR
                </span>
                <span className='font-mono text-[44px] leading-none font-bold tracking-[-0.03em]'>
                  82
                  <span className='text-lg text-muted-foreground'> / 100</span>
                </span>
              </div>
              <SampleChip tone='success' className='mb-1 text-[13px]'>
                <ChevronUp className='size-3' strokeWidth={3} aria-hidden />
                +6 vs main
              </SampleChip>
            </div>
            <dl className='grid grid-cols-3 gap-2.5'>
              {prStats.map((stat) => (
                <div
                  key={stat.label}
                  className='flex flex-col-reverse gap-0.5 rounded-lg bg-muted/60 p-3'
                >
                  <dt className='text-xs text-muted-foreground'>
                    {stat.label}
                  </dt>
                  <dd className='font-mono text-xl font-bold'>{stat.value}</dd>
                </div>
              ))}
            </dl>
            <div className='flex flex-col gap-2.5'>
              <h3 className='text-sm font-[650]'>Top regressions</h3>
              <ul className='flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border'>
                {regressions.map((regression) => (
                  <li key={regression.rule} className={findingRowClassName}>
                    <SampleChip
                      tone={regression.tone}
                      className='px-1.75 py-px text-[11px]'
                    >
                      {regression.change}
                    </SampleChip>
                    <span className='font-mono text-[13px] font-semibold'>
                      {regression.rule}
                    </span>
                    <span className='text-sm'>{regression.name}</span>
                    <span className='ms-auto font-mono text-xs text-muted-foreground'>
                      {regression.where}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className='flex flex-col gap-2.5'>
              <h3 className='text-sm font-[650]'>Fixed in this PR</h3>
              <div
                className={`${findingRowClassName} rounded-lg border border-border`}
              >
                <SampleChip
                  tone='success'
                  className='px-1.75 py-px text-[11px]'
                >
                  fixed
                </SampleChip>
                <span className='font-mono text-[13px] font-semibold'>
                  OPT-106
                </span>
                <span className='text-sm'>Unlabeled field</span>
                <span className='ms-auto font-mono text-xs text-muted-foreground'>
                  4 pages
                </span>
              </div>
            </div>
          </div>
        </article>

        <div className='flex min-w-0 flex-[1_1_320px] flex-col gap-4'>
          <section
            aria-labelledby='checks-status-title'
            className='overflow-hidden rounded-lg border border-input bg-card'
          >
            <div className='flex items-center gap-2.5 border-b border-border px-4.5 py-3.5'>
              <span
                aria-hidden='true'
                className='flex size-5.5 items-center justify-center rounded-full bg-success text-background'
              >
                <Check className='size-3' strokeWidth={3.5} />
              </span>
              <h3 id='checks-status-title' className='text-[15px] font-[650]'>
                All checks have passed
              </h3>
            </div>
            <ul className='flex flex-col divide-y divide-border py-1.5'>
              <li className='flex flex-wrap items-center gap-x-2.5 gap-y-1.5 px-4.5 py-2.5'>
                <Check
                  className='size-4 text-success'
                  strokeWidth={3}
                  aria-hidden
                />
                <span className='font-mono text-[13px] font-semibold'>
                  optikí / agent-readiness
                </span>
                <span className='rounded-full border border-input px-1.75 text-[11px] font-semibold text-muted-foreground'>
                  Required
                </span>
                <span className='basis-full ps-6.5 text-[13px] text-muted-foreground'>
                  Score 82 · threshold 75
                </span>
              </li>
              {statusChecks.map((check) => (
                <li
                  key={check.name}
                  className='flex flex-wrap items-center gap-x-2.5 gap-y-1.5 px-4.5 py-2.5'
                >
                  <Check
                    className='size-4 text-success'
                    strokeWidth={3}
                    aria-hidden
                  />
                  <span className='font-mono text-[13px] font-semibold'>
                    {check.name}
                  </span>
                  <span className='ms-auto text-[13px] text-muted-foreground'>
                    {check.status}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <figure className='flex flex-col gap-3 rounded-lg border border-input bg-card p-4.5'>
            <figcaption className='flex items-center justify-between gap-2.5'>
              <span className='text-[15px] font-[650]'>
                Score on main, last 10 deploys
              </span>
              <span className='rounded-[4px] border border-dashed border-input px-1.75 py-px font-mono text-[11px] text-muted-foreground'>
                Sample data
              </span>
            </figcaption>
            <svg
              role='img'
              aria-label='Line chart of the score on main over the last 10 deploys, rising from 61 to 82 and crossing the threshold of 75. Sample data.'
              viewBox='0 0 320 150'
              className='block h-auto w-full overflow-visible'
            >
              {[30, 70, 110].map((y) => (
                <line
                  key={y}
                  x1='28'
                  x2='312'
                  y1={y}
                  y2={y}
                  className='stroke-border'
                  strokeWidth='1'
                />
              ))}
              <text x='0' y='34' className={chartLabelClassName}>
                90
              </text>
              <text x='0' y='74' className={chartLabelClassName}>
                70
              </text>
              <text x='0' y='114' className={chartLabelClassName}>
                50
              </text>
              <line
                x1='28'
                x2='312'
                y1='60'
                y2='60'
                className='stroke-warning'
                strokeWidth='1.25'
                strokeDasharray='4 4'
              />
              <text
                x='312'
                y='54'
                textAnchor='end'
                className='fill-warning font-mono text-[10px]'
              >
                threshold 75
              </text>
              <polygon
                points={`${chartPoints} 306,130 36,130`}
                className='fill-primary/10'
              />
              <polyline
                points={chartPoints}
                fill='none'
                className='stroke-primary'
                strokeWidth='2.25'
                strokeLinejoin='round'
                strokeLinecap='round'
              />
              <circle
                cx='306'
                cy='46'
                r='4.5'
                className='fill-primary stroke-card'
                strokeWidth='2'
              />
              <text
                x='306'
                y='34'
                textAnchor='end'
                className='fill-foreground font-mono text-[11px] font-bold'
              >
                82
              </text>
              <text x='36' y='146' className={chartLabelClassName}>
                10 deploys ago
              </text>
              <text
                x='306'
                y='146'
                textAnchor='end'
                className={chartLabelClassName}
              >
                now
              </text>
            </svg>
          </figure>
        </div>
      </div>
    </LandingSection>
  )
}
