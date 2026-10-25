export type TAnonymousState = {
  anonymousID: string
}

export type TAnonymousActions = {
  createAnonymousID: () => string
  clearAnonymousID: () => void
}
