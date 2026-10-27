import { ArrowUpRight } from 'lucide-react'
import { githubActionHref } from '@constants/links'
import { LandingScanLink } from '@modules/home/ui/landing-scan-link'
import { ScanDemo } from '@modules/home/ui/scan-demo'

export const HeroSection: React.FC = () => {
  return (
    <section
      aria-labelledby='hero-title'
      className='relative overflow-hidden pt-[clamp(48px,8vw,96px)] pb-[clamp(64px,8vw,104px)] [--grid:color-mix(in_oklab,var(--foreground)_5%,transparent)]'
    >
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 bg-[linear-gradient(var(--grid)_1px,transparent_1px),linear-gradient(90deg,var(--grid)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_70%_55%_at_50%_25%,black_25%,transparent_75%)] bg-size-[56px_56px]'
      />
      <div
        aria-hidden='true'
        className='pointer-events-none absolute -top-60 left-1/2 h-160 w-275 -translate-x-1/2 bg-[radial-gradient(closest-side,var(--glow),transparent)]'
      />
      <div className='relative mx-auto max-w-300 px-[clamp(16px,4vw,32px)] text-center'>
        <a
          href={githubActionHref}
          className='inline-flex max-w-full items-center gap-2.5 rounded-full border border-input bg-card py-1.25 ps-1.25 pe-3.5 text-[13px] transition-colors hover:bg-muted/60'
        >
          <span className='shrink-0 rounded-full bg-primary px-2 py-0.5 font-mono text-[11px] font-bold tracking-[0.06em] text-primary-foreground'>
            NEW
          </span>
          <span className='min-w-0 text-left'>
            Scan every pull request from your CI
          </span>
          <ArrowUpRight className='size-3.5 shrink-0' aria-hidden />
        </a>

        <h1
          id='hero-title'
          className='mx-auto mt-7 max-w-230 text-[clamp(38px,7vw,76px)] leading-[1.02] font-[750] tracking-[-0.04em] text-balance'
        >
          Is your site readable to{' '}
          <span className='text-primary'>AI agents?</span>
        </h1>

        <p className='mx-auto mt-5.5 max-w-160 text-[clamp(17px,1.8vw,20px)] leading-[1.55] text-balance text-muted-foreground'>
          optikí scans any page the way an AI agent reads it, scores it from 0
          to 100, and hands you the exact fix for everything in the way.
        </p>

        <LandingScanLink className='mx-auto mt-9 max-w-160 text-left' />

        <div className='relative mx-auto mt-[clamp(48px,7vw,72px)] max-w-250 text-left'>
          <div
            aria-hidden='true'
            className='pointer-events-none absolute -inset-x-10 -inset-y-15 bg-[radial-gradient(closest-side,var(--glow),transparent)]'
          />
          <div className='relative'>
            <ScanDemo />
          </div>
        </div>
      </div>
    </section>
  )
}
