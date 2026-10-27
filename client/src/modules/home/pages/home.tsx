import { useNavigationScroll } from '@hooks/use-navigation-scroll'
import { HomeLayout } from '@modules/home/layout/home-layout'
import { ChecksSection } from '@modules/home/ui/checks-section'
import { CiSection } from '@modules/home/ui/ci-section'
import { FaqSection } from '@modules/home/ui/faq-section'
import { FinalCtaSection } from '@modules/home/ui/final-cta-section'
import { HeroSection } from '@modules/home/ui/hero-section'
import { HowItWorksSection } from '@modules/home/ui/how-it-works-section'
import { IntegrationsSection } from '@modules/home/ui/integrations-section'
import { ReportSection } from '@modules/home/ui/report-section'
import { ShiftSection } from '@modules/home/ui/shift-section'

export const Home: React.FC = () => {
  useNavigationScroll(true)

  return (
    <HomeLayout>
      <div className='[--glow:color-mix(in_oklab,var(--primary)_12%,transparent)] dark:[--glow:color-mix(in_oklab,var(--primary)_16%,transparent)]'>
        <HeroSection />
        <ShiftSection />
        <ChecksSection />
        <ReportSection />
        <HowItWorksSection />
        <CiSection />
        <IntegrationsSection />
        <FaqSection />
        <FinalCtaSection />
      </div>
    </HomeLayout>
  )
}
