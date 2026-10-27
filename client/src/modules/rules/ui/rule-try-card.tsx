import { Link } from 'react-router-dom'
import { ScanSearch } from 'lucide-react'
import type { TRule } from '@typings/rules'
import { useAuthStore } from '@stores/auth'
import { cn } from '@utils/classname'
import { buttonVariants } from '@shared/ui/button'

type RuleTryCardProps = {
  rule: TRule
}

const getTryText = (rule: TRule) => {
  if (rule.ruleSets.includes('CORE')) {
    return 'It runs on every scan, signed out included. Paste an address and see where it fails.'
  }
  if (rule.renderedOnly) {
    return "It needs the page loaded in a real browser, so it runs when you're signed in or use an API token."
  }
  return "It's in the full rule set, so it runs when you're signed in or use an API token."
}

export const RuleTryCard: React.FC<RuleTryCardProps> = ({ rule }) => {
  const isLoggedIn = useAuthStore((state) => !!state.auth.session.userID)

  return (
    <section
      aria-labelledby='try-heading'
      className='rounded-lg border border-border bg-card bg-linear-160 from-primary/10 to-transparent to-65% p-5'
    >
      <h2 id='try-heading' className='text-base font-bold tracking-[-0.01em]'>
        Does your page pass {rule.id}?
      </h2>
      <p className='mt-2 text-sm leading-[1.55] text-muted-foreground'>
        {getTryText(rule)}
      </p>
      <Link
        to='/scan'
        className={cn(
          buttonVariants(),
          'mt-4 h-10.5 w-full font-semibold text-primary-foreground'
        )}
      >
        <ScanSearch className='size-4' aria-hidden />
        Scan a page
      </Link>
      {!rule.ruleSets.includes('CORE') && !isLoggedIn && (
        <Link
          to='/auth/signin?redirectTo=/u/scan'
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'mt-2 h-10 w-full'
          )}
        >
          Sign in for all 17 rules
        </Link>
      )}
    </section>
  )
}
