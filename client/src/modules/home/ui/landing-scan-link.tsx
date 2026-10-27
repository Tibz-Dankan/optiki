import { Link } from 'react-router-dom'
import { Globe, ScanSearch } from 'lucide-react'
import { guestScanLimit } from '@constants/scan'
import { useAuthStore } from '@stores/auth'
import { cn } from '@utils/classname'
import { buttonVariants } from '@shared/ui/button'

type LandingScanLinkProps = {
  className?: string
}

export const LandingScanLink: React.FC<LandingScanLinkProps> = ({
  className,
}) => {
  const isVerifiedUser = useAuthStore(
    (state) => !!state.auth.session.userID && state.auth.user.emailVerified
  )

  return (
    <div className={className}>
      <Link
        to='/scan'
        className='group grid gap-2 rounded-lg border border-input bg-card ps-5 pe-3 pt-4 pb-3 shadow-[0_24px_48px_-24px_rgb(0_0_0/0.15)] ring-4 ring-transparent transition-[border-color,box-shadow] outline-none hover:border-primary focus-visible:border-primary focus-visible:ring-primary/22 dark:shadow-[0_24px_48px_-24px_rgb(0_0_0/0.7)]'
      >
        <span
          aria-hidden='true'
          className='text-[13px] leading-none font-medium text-muted-foreground'
        >
          Page address
        </span>
        <span className='flex flex-wrap items-center gap-3'>
          <Globe
            className='size-5.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary group-focus-visible:text-primary'
            aria-hidden
          />
          <span
            aria-hidden='true'
            className='block h-12 min-w-0 flex-[999_1_15rem] truncate pe-2 text-xl leading-12 font-medium tracking-[-0.01em] text-muted-foreground'
          >
            https://example.com/pricing
          </span>
          <span
            className={cn(
              buttonVariants({ size: 'lg' }),
              'h-12 flex-[1_0_auto] text-base font-semibold group-hover:bg-primary/90 has-[>svg]:px-5.5'
            )}
          >
            <ScanSearch className='size-4.5' strokeWidth={2.25} aria-hidden />
            Scan<span className='sr-only'> a page</span>
          </span>
        </span>
      </Link>
      <p className='mt-3.5 text-center font-mono text-xs text-muted-foreground'>
        {isVerifiedUser
          ? 'All 17 rules · rendered in a real browser'
          : `${guestScanLimit} free scans · no account · results in seconds`}
      </p>
    </div>
  )
}
