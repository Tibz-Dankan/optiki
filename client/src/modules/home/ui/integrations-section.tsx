import { Link } from 'react-router-dom'
import { SquareTerminal, Workflow } from 'lucide-react'
import { PRODUCTION_API_URL } from '@constants/urls'
import { CodeBlock } from '@shared/ui/code-block'
import { LandingSection } from '@modules/home/ui/landing-section'
import { SectionHeading } from '@modules/home/ui/section-heading'

const integrations = [
  { icon: Workflow, name: 'GitHub Actions' },
  { icon: SquareTerminal, name: 'Anything with curl' },
]

const scanCommand = `# Scan the preview of this pull request
curl -sX POST ${PRODUCTION_API_URL}/scan \\
  -H "Authorization: Bearer $OPTIKI_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "'"$PREVIEW_URL"'"}'

# → { "data": { "scores": { "overall": 82 }, … } }`

export const IntegrationsSection: React.FC = () => {
  return (
    <LandingSection
      id='integrations'
      labelledBy='integrations-title'
      isBand
      containerClassName='flex flex-wrap items-center gap-x-14 gap-y-10'
    >
      <div className='flex min-w-0 flex-[1_1_380px] flex-col gap-4'>
        <SectionHeading
          id='integrations-title'
          eyebrow='Integrations'
          title='Works where you work.'
        >
          optikí is an HTTP API with a token, so anything that can make a
          request can run a scan. Point it at a preview URL and gate the merge.
        </SectionHeading>
        <ul className='mt-2 flex flex-wrap gap-2'>
          {integrations.map((integration) => (
            <li
              key={integration.name}
              className='inline-flex h-9.5 items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-sm font-medium'
            >
              <integration.icon className='size-4 text-primary' aria-hidden />
              {integration.name}
            </li>
          ))}
        </ul>
        <p className='mt-2 text-[15px] leading-[1.6] text-muted-foreground'>
          Prefer a browser? The{' '}
          <Link
            to='/u/scans'
            className='font-semibold text-foreground underline underline-offset-4 transition-colors hover:text-primary'
          >
            web dashboard
          </Link>{' '}
          keeps every scan, report and fix report in one place.
        </p>
      </div>
      <CodeBlock
        code={scanCommand}
        language='shellscript'
        title='.ci/optiki-scan.sh'
        copyLabel='Copy the CI scan command'
        className='min-w-0 flex-[1_1_440px] border-input shadow-[0_40px_80px_-40px_rgb(15_23_42/0.22)] dark:shadow-[0_40px_80px_-40px_rgb(0_0_0/0.75)]'
      />
    </LandingSection>
  )
}
