import { useAnonymousStore } from '@stores/anonymous'

export function getAnonymousID(): string {
  const { anonymousID, createAnonymousID } = useAnonymousStore.getState()
  return anonymousID || createAnonymousID()
}
