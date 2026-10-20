import { SettingsLayout } from '@modules/settings/layout/settings-layout'
import { AccountSection } from '@modules/settings/ui/account-section'
import { ActiveSessionsSection } from '@modules/settings/ui/active-sessions-section'
import { ContentSection } from '@modules/settings/ui/content-section'

export const SettingsAccount: React.FC = () => {
  return (
    <SettingsLayout>
      <ContentSection
        title='Account'
        desc='Manage your sign-in details and sessions.'
      >
        <AccountSection />
        <ActiveSessionsSection />
      </ContentSection>
    </SettingsLayout>
  )
}
