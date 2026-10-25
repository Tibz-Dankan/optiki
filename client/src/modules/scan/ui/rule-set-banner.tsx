import { Link } from 'react-router-dom'
import { Info } from 'lucide-react'
import type { TScanSummary } from '@typings/scan'

type RuleSetBannerProps = {
  scan: TScanSummary
}

export const RuleSetBanner: React.FC<RuleSetBannerProps> = ({ scan }) => {
  if (scan.ruleSet === 'CORE') {
    return (
      <p className='flex items-start gap-2 rounded-md border border-border bg-muted p-3 text-sm'>
        <Info className='mt-0.5 size-4 shrink-0' aria-hidden />
        <span>
          Ran the 9 core rules.{' '}
          <Link
            to='/auth/signin?redirectTo=/scan'
            className='font-medium underline underline-offset-4'
          >
            Sign in to run all 17 rules
          </Link>{' '}
          and render URLs in a real browser.
        </span>
      </p>
    )
  }
  if (scan.mode === 'STATIC' && scan.counts.rulesNeedRendered > 0) {
    return (
      <p className='flex items-start gap-2 rounded-md border border-border bg-muted p-3 text-sm'>
        <Info className='mt-0.5 size-4 shrink-0' aria-hidden />
        <span>
          Static scan: {scan.counts.rulesNeedRendered} rules need a rendered
          page. Scan a URL to run them in a real browser.
        </span>
      </p>
    )
  }
  return null
}
