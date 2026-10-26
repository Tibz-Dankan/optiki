import { LandingScanForm } from '@modules/home/ui/landing-scan-form'
import { LandingSection } from '@modules/home/ui/landing-section'

export const FinalCtaSection: React.FC = () => {
  return (
    <LandingSection
      labelledBy='final-title'
      className='relative overflow-hidden border-t border-border py-[clamp(80px,10vw,128px)]'
      containerClassName='relative text-center'
    >
      <div
        aria-hidden='true'
        className='pointer-events-none absolute top-1/2 left-1/2 h-130 w-225 -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(closest-side,var(--glow),transparent)]'
      />
      <h2
        id='final-title'
        className='relative mx-auto max-w-205 text-[clamp(34px,5.6vw,64px)] leading-[1.04] font-[750] tracking-[-0.04em] text-balance'
      >
        Be the site agents can actually read.
      </h2>
      <p className='relative mx-auto mt-5 max-w-140 text-[clamp(16px,1.6vw,19px)] leading-[1.6] text-muted-foreground'>
        Paste an address. Get your score in seconds. Fix what it finds.
      </p>
      <LandingScanForm
        id='final-url'
        label="Your page's address"
        submitLabel={
          <>
            Scan<span className='sr-only'> your page</span>
          </>
        }
        className='relative mx-auto mt-9 max-w-160 text-left'
      />
    </LandingSection>
  )
}
