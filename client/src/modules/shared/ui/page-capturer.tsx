import { useCapturePageVisit } from '@hooks/use-capture-page-visit'

export const PageCapturer: React.FC = () => {
  useCapturePageVisit()
  return null
}
