import { SettingsLayout } from '@modules/settings/layout/settings-layout'
import { ContentSection } from '@modules/settings/ui/content-section'
import { PreferencesSection } from '@modules/settings/ui/preferences-section'
import { ProfileSection } from '@modules/settings/ui/profile-section'

export const SettingsGeneral: React.FC = () => {
  return (
    <SettingsLayout>
      <ContentSection
        title='General'
        desc='Update your profile and how the app looks.'
      >
        <ProfileSection />
        <PreferencesSection />
      </ContentSection>
    </SettingsLayout>
  )
}
